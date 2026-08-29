package auth

import (
	"context"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"
)

const (
	passwordIterations = 210000
	passwordKeyLength  = 32
	sessionTTL         = 30 * 24 * time.Hour
	initialCredits     = 100
)

type SQLProvider interface {
	SQLDB() *sql.DB
}

type Service struct {
	db *sql.DB
}

func NewService(provider SQLProvider) *Service {
	return &Service{db: provider.SQLDB()}
}

func (s *Service) Register(req RegisterRequest) (User, Session, error) {
	email, err := normalizeEmail(req.Email)
	if err != nil {
		return User{}, Session{}, err
	}
	if err := validatePassword(req.Password); err != nil {
		return User{}, Session{}, err
	}
	if req.Password != req.PasswordConfirm {
		return User{}, Session{}, errors.New("passwords do not match")
	}

	salt, hash, err := hashPassword(req.Password)
	if err != nil {
		return User{}, Session{}, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now().UTC()
	user := User{
		ID:        newID("usr"),
		Email:     email,
		Credits:   initialCredits,
		IsAdmin:   false,
		CreatedAt: now,
	}
	_, err = s.db.ExecContext(ctx, `
INSERT INTO users (id, email, password_hash, password_salt, credits, is_admin, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?)`,
		user.ID,
		user.Email,
		hash,
		salt,
		user.Credits,
		boolToInt(user.IsAdmin),
		user.CreatedAt.Format(time.RFC3339Nano),
	)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return User{}, Session{}, errors.New("email is already registered")
		}
		return User{}, Session{}, err
	}

	session := newSession(user.ID)
	if err := s.saveSession(ctx, session); err != nil {
		return User{}, Session{}, err
	}
	return user, session, nil
}

func (s *Service) Login(req LoginRequest) (User, Session, error) {
	email, err := normalizeEmail(req.Email)
	if err != nil {
		return User{}, Session{}, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user, passwordHash, passwordSalt, err := s.userByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, Session{}, errors.New("invalid email or password")
		}
		return User{}, Session{}, err
	}
	if !verifyPassword(req.Password, passwordSalt, passwordHash) {
		return User{}, Session{}, errors.New("invalid email or password")
	}

	session := newSession(user.ID)
	if err := s.saveSession(ctx, session); err != nil {
		return User{}, Session{}, err
	}
	return user, session, nil
}

func (s *Service) UserBySession(token string) (User, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	var createdAt string
	var adminInt int
	err := s.db.QueryRowContext(ctx, `
SELECT u.id, u.email, u.credits, u.is_admin, u.created_at
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token = ? AND s.expires_at > ?`,
		token,
		time.Now().UTC().Format(time.RFC3339Nano),
	).Scan(&user.ID, &user.Email, &user.Credits, &adminInt, &createdAt)
	if err != nil {
		return User{}, false
	}
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return User{}, false
	}
	user.IsAdmin = adminInt == 1
	user.CreatedAt = parsed
	return user, true
}

func (s *Service) DebitCredits(userID string, amount int) (User, error) {
	if amount <= 0 {
		return User{}, errors.New("credit amount must be positive")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.db.ExecContext(ctx, `
UPDATE users
SET credits = credits - ?
WHERE id = ? AND credits >= ?`,
		amount,
		userID,
		amount,
	)
	if err != nil {
		return User{}, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return User{}, err
	}
	if affected == 0 {
		return User{}, errors.New("insufficient credits")
	}
	return s.userByID(ctx, userID)
}

func (s *Service) AddCredits(userID string, amount int) {
	if amount <= 0 {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = s.db.ExecContext(ctx, `UPDATE users SET credits = credits + ? WHERE id = ?`, amount, userID)
}

func (s *Service) SetAdminByEmail(email string, isAdmin bool) error {
	normalizedEmail, err := normalizeEmail(email)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := s.db.ExecContext(ctx, `UPDATE users SET is_admin = ? WHERE email = ?`, boolToInt(isAdmin), normalizedEmail)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Service) DeleteSession(token string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token = ?`, token)
}

func (s *Service) saveSession(ctx context.Context, session Session) error {
	_, err := s.db.ExecContext(ctx, `
INSERT INTO sessions (token, user_id, expires_at, created_at)
VALUES (?, ?, ?, ?)`,
		session.Token,
		session.UserID,
		session.ExpiresAt.Format(time.RFC3339Nano),
		time.Now().UTC().Format(time.RFC3339Nano),
	)
	return err
}

func (s *Service) userByEmail(ctx context.Context, email string) (User, string, string, error) {
	var user User
	var passwordHash string
	var passwordSalt string
	var createdAt string
	var adminInt int
	err := s.db.QueryRowContext(ctx, `
SELECT id, email, password_hash, password_salt, credits, is_admin, created_at
FROM users
WHERE email = ?`, email).Scan(&user.ID, &user.Email, &passwordHash, &passwordSalt, &user.Credits, &adminInt, &createdAt)
	if err != nil {
		return User{}, "", "", err
	}
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return User{}, "", "", err
	}
	user.IsAdmin = adminInt == 1
	user.CreatedAt = parsed
	return user, passwordHash, passwordSalt, nil
}

func (s *Service) userByID(ctx context.Context, id string) (User, error) {
	var user User
	var createdAt string
	var adminInt int
	err := s.db.QueryRowContext(ctx, `
SELECT id, email, credits, is_admin, created_at
FROM users
WHERE id = ?`, id).Scan(&user.ID, &user.Email, &user.Credits, &adminInt, &createdAt)
	if err != nil {
		return User{}, err
	}
	parsed, err := time.Parse(time.RFC3339Nano, createdAt)
	if err != nil {
		return User{}, err
	}
	user.IsAdmin = adminInt == 1
	user.CreatedAt = parsed
	return user, nil
}

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	if email == "" {
		return "", errors.New("email is required")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return "", errors.New("invalid email")
	}
	return email, nil
}

func validatePassword(value string) error {
	if len(value) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}

func hashPassword(password string) (string, string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", "", err
	}
	key, err := pbkdf2.Key(sha256.New, password, salt, passwordIterations, passwordKeyLength)
	if err != nil {
		return "", "", err
	}
	return base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(key), nil
}

func verifyPassword(password, encodedSalt, encodedHash string) bool {
	salt, err := base64.RawStdEncoding.DecodeString(encodedSalt)
	if err != nil {
		return false
	}
	expected, err := base64.RawStdEncoding.DecodeString(encodedHash)
	if err != nil {
		return false
	}
	actual, err := pbkdf2.Key(sha256.New, password, salt, passwordIterations, passwordKeyLength)
	if err != nil {
		return false
	}
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func newSession(userID string) Session {
	return Session{
		Token:     newID("sess"),
		UserID:    userID,
		ExpiresAt: time.Now().UTC().Add(sessionTTL),
	}
}

func newID(prefix string) string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return prefix + "_" + hex.EncodeToString(bytes)
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
