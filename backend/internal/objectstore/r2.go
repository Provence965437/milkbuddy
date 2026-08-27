package objectstore

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"milkbuddy/backend/internal/config"
)

type Object struct {
	Key         string
	Data        []byte
	ContentType string
}

type StoredObject struct {
	Key string
	URL string
}

type R2 struct {
	accountID       string
	bucket          string
	accessKeyID     string
	secretAccessKey string
	publicBaseURL   string
	http            *http.Client
}

func NewR2(cfg config.R2Config, timeout time.Duration) (*R2, error) {
	if cfg.AccountID == "" && cfg.Bucket == "" && cfg.AccessKeyID == "" && cfg.SecretAccessKey == "" {
		return nil, nil
	}
	if cfg.AccountID == "" || cfg.Bucket == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		return nil, errors.New("incomplete R2 configuration")
	}
	return &R2{
		accountID:       cfg.AccountID,
		bucket:          cfg.Bucket,
		accessKeyID:     cfg.AccessKeyID,
		secretAccessKey: cfg.SecretAccessKey,
		publicBaseURL:   cfg.PublicBaseURL,
		http:            &http.Client{Timeout: timeout},
	}, nil
}

func (r *R2) Store(ctx context.Context, object Object) (StoredObject, error) {
	if strings.TrimSpace(object.Key) == "" {
		return StoredObject{}, errors.New("object key is required")
	}
	if object.ContentType == "" {
		object.ContentType = "application/octet-stream"
	}

	escapedKey := escapeObjectKey(object.Key)
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com/%s/%s", r.accountID, url.PathEscape(r.bucket), escapedKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, endpoint, bytes.NewReader(object.Data))
	if err != nil {
		return StoredObject{}, err
	}
	req.Header.Set("Content-Type", object.ContentType)
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(object.Data)))
	r.sign(req, object.Data)

	resp, err := r.http.Do(req)
	if err != nil {
		return StoredObject{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return StoredObject{}, fmt.Errorf("r2 put object returned %s: %s", resp.Status, string(body))
	}

	return StoredObject{
		Key: object.Key,
		URL: r.publicURL(object.Key),
	}, nil
}

func (r *R2) Delete(ctx context.Context, key string) error {
	if strings.TrimSpace(key) == "" {
		return nil
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com/%s/%s", r.accountID, url.PathEscape(r.bucket), escapeObjectKey(key))
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, endpoint, nil)
	if err != nil {
		return err
	}
	r.sign(req, nil)

	resp, err := r.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("r2 delete object returned %s: %s", resp.Status, string(body))
	}
	return nil
}

func (r *R2) sign(req *http.Request, payload []byte) {
	now := time.Now().UTC()
	date := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")
	payloadHash := sha256Hex(payload)

	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)

	canonicalHeaders := "host:" + req.URL.Host + "\n" +
		"x-amz-content-sha256:" + payloadHash + "\n" +
		"x-amz-date:" + amzDate + "\n"
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"
	canonicalRequest := strings.Join([]string{
		req.Method,
		req.URL.EscapedPath(),
		req.URL.RawQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	scope := date + "/auto/s3/aws4_request"
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		scope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")
	signingKey := awsSigningKey(r.secretAccessKey, date, "auto", "s3")
	signature := hex.EncodeToString(hmacSHA256(signingKey, stringToSign))

	req.Header.Set("Authorization", fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		r.accessKeyID,
		scope,
		signedHeaders,
		signature,
	))
}

func (r *R2) publicURL(key string) string {
	if r.publicBaseURL == "" {
		return ""
	}
	return r.publicBaseURL + "/" + escapeObjectKey(key)
}

func escapeObjectKey(key string) string {
	parts := strings.Split(path.Clean("/"+key), "/")
	for index, part := range parts {
		parts[index] = url.PathEscape(part)
	}
	return strings.TrimPrefix(strings.Join(parts, "/"), "/")
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func awsSigningKey(secret, date, region, service string) []byte {
	key := hmacSHA256([]byte("AWS4"+secret), date)
	key = hmacSHA256(key, region)
	key = hmacSHA256(key, service)
	return hmacSHA256(key, "aws4_request")
}

func hmacSHA256(key []byte, value string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(value))
	return mac.Sum(nil)
}
