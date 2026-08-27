package assets

import "time"

type Asset struct {
	ID           string    `json:"id"`
	GenerationID string    `json:"generation_id"`
	ImageIndex   int       `json:"image_index"`
	URL          string    `json:"url"`
	StorageKey   string    `json:"storage_key,omitempty"`
	Filename     string    `json:"filename,omitempty"`
	StyleID      string    `json:"style_id"`
	StyleName    string    `json:"style_name"`
	AspectRatio  string    `json:"aspect_ratio"`
	Quality      string    `json:"quality"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	Seed         int64     `json:"seed"`
	Prompt       string    `json:"prompt"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateAsset struct {
	ID           string
	GenerationID string
	ImageIndex   int
	URL          string
	StorageKey   string
	Filename     string
	StyleID      string
	AspectRatio  string
	Quality      string
	Width        int
	Height       int
	Seed         int64
	Prompt       string
	Status       string
	CreatedAt    time.Time
}

type ListResponse struct {
	Assets []Asset `json:"assets"`
	Total  int     `json:"total"`
}
