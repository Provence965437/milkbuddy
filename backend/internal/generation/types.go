package generation

import "time"

type CreateRequest struct {
	Prompt         string `json:"prompt"`
	NegativePrompt string `json:"negative_prompt"`
	StyleID        string `json:"style_id"`
	AspectRatio    string `json:"aspect_ratio"`
	Quality        string `json:"quality"`
	ImageCount     int    `json:"image_count"`
	Seed           int64  `json:"seed"`
}

type JobStatus string

const (
	StatusQueued    JobStatus = "queued"
	StatusRunning   JobStatus = "running"
	StatusCompleted JobStatus = "completed"
	StatusFailed    JobStatus = "failed"
)

type Job struct {
	ID        string    `json:"id"`
	PromptID  string    `json:"prompt_id"`
	Status    JobStatus `json:"status"`
	Prompt    string    `json:"prompt"`
	Params    JobParams `json:"params"`
	Images    []Image   `json:"images"`
	Error     string    `json:"error,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type JobParams struct {
	StyleID     string `json:"style_id"`
	AspectRatio string `json:"aspect_ratio"`
	Quality     string `json:"quality"`
	ImageCount  int    `json:"image_count"`
	Seed        int64  `json:"seed"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Steps       int    `json:"steps"`
	CFG         int    `json:"cfg"`
}

type Image struct {
	Index      int    `json:"index"`
	URL        string `json:"url"`
	Filename   string `json:"filename"`
	Subfolder  string `json:"subfolder"`
	Type       string `json:"type"`
	StorageKey string `json:"storage_key,omitempty"`
}
