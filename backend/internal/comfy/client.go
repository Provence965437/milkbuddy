package comfy

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		baseURL: baseURL,
		http: &http.Client{
			Timeout: timeout,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Required for some self-hosted ComfyUI HTTPS tunnels.
			},
		},
	}
}

func (c *Client) SubmitPrompt(ctx context.Context, workflow map[string]interface{}, clientID string) (SubmitResponse, error) {
	body, err := json.Marshal(map[string]interface{}{
		"prompt":    workflow,
		"client_id": clientID,
	})
	if err != nil {
		return SubmitResponse{}, err
	}

	var out SubmitResponse
	if err := c.doJSON(ctx, http.MethodPost, "/prompt", bytes.NewReader(body), &out); err != nil {
		return SubmitResponse{}, err
	}
	return out, nil
}

func (c *Client) History(ctx context.Context, promptID string) (HistoryItem, bool, error) {
	var out HistoryResponse
	if err := c.doJSON(ctx, http.MethodGet, "/history/"+url.PathEscape(promptID), nil, &out); err != nil {
		return HistoryItem{}, false, err
	}
	item, ok := out[promptID]
	return item, ok, nil
}

func (c *Client) Image(ctx context.Context, image ImageRef) ([]byte, string, error) {
	query := url.Values{}
	query.Set("filename", image.Filename)
	query.Set("type", image.Type)
	query.Set("subfolder", image.Subfolder)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/view?"+query.Encode(), nil)
	if err != nil {
		return nil, "", err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, "", fmt.Errorf("comfy image returned %s", resp.Status)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	return data, resp.Header.Get("Content-Type"), nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, body io.Reader, out interface{}) error {
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("comfy returned %s: %s", resp.Status, string(data))
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("decode comfy response: %w", err)
	}
	return nil
}
