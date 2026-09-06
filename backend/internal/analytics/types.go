package analytics

import "time"

type TrackRequest struct {
	EventName string                 `json:"event_name"`
	Page      string                 `json:"page,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

type Event struct {
	UserID    string
	EventName string
	Page      string
	Metadata  map[string]interface{}
	CreatedAt time.Time
}

type Metrics struct {
	Totals Totals       `json:"totals"`
	Trend  []TrendPoint `json:"trend"`
}

type Totals struct {
	Users           int `json:"users"`
	Visits          int `json:"visits"`
	ActiveUsers     int `json:"active_users"`
	GenerationRuns  int `json:"generation_runs"`
	GeneratedImages int `json:"generated_images"`
	CreditsConsumed int `json:"credits_consumed"`
	Assets          int `json:"assets"`
	Last7DayVisits  int `json:"last_7_day_visits"`
	Last7DayUsers   int `json:"last_7_day_users"`
	Last7DayRuns    int `json:"last_7_day_runs"`
	Last7DayImages  int `json:"last_7_day_images"`
}

type TrendPoint struct {
	Date            string `json:"date"`
	Users           int    `json:"users"`
	Visits          int    `json:"visits"`
	GenerationRuns  int    `json:"generation_runs"`
	GeneratedImages int    `json:"generated_images"`
}
