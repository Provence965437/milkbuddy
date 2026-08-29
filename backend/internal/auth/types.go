package auth

import "time"

type RegisterRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Credits   int       `json:"credits"`
	CreatedAt time.Time `json:"created_at"`
}

type Session struct {
	Token     string
	UserID    string
	ExpiresAt time.Time
}

type AuthResponse struct {
	User User `json:"user"`
}
