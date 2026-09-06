package analytics

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type SQLProvider interface {
	SQLDB() *sql.DB
}

type Repository struct {
	db *sql.DB
}

func NewRepository(provider SQLProvider) *Repository {
	return &Repository{db: provider.SQLDB()}
}

func (r *Repository) Track(ctx context.Context, event Event) error {
	event.EventName = strings.TrimSpace(event.EventName)
	if event.EventName == "" {
		return nil
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	metadata := ""
	if len(event.Metadata) > 0 {
		data, err := json.Marshal(event.Metadata)
		if err != nil {
			return err
		}
		metadata = string(data)
	}

	_, err := r.db.ExecContext(ctx, `
INSERT INTO analytics_events (id, user_id, event_name, page, metadata, created_at)
VALUES (?, ?, ?, ?, ?, ?)`,
		newID(),
		nullable(event.UserID),
		event.EventName,
		strings.TrimSpace(event.Page),
		metadata,
		event.CreatedAt.Format(time.RFC3339Nano),
	)
	return err
}

func (r *Repository) Metrics(ctx context.Context, days int) (Metrics, error) {
	if days <= 0 || days > 90 {
		days = 14
	}
	now := time.Now().UTC()
	start := startOfUTCDate(now.AddDate(0, 0, -days+1))
	last7Start := startOfUTCDate(now.AddDate(0, 0, -6)).Format(time.RFC3339Nano)

	var totals Totals
	var err error
	if totals.Users, err = r.count(ctx, `SELECT COUNT(*) FROM users`); err != nil {
		return Metrics{}, err
	}
	if totals.Visits, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'page_view'`); err != nil {
		return Metrics{}, err
	}
	if totals.ActiveUsers, err = r.count(ctx, `SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE user_id IS NOT NULL AND user_id != ''`); err != nil {
		return Metrics{}, err
	}
	if totals.GenerationRuns, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'generation_requested'`); err != nil {
		return Metrics{}, err
	}
	if totals.GeneratedImages, err = r.count(ctx, `SELECT COUNT(*) FROM assets`); err != nil {
		return Metrics{}, err
	}
	if totals.Assets, err = r.count(ctx, `SELECT COUNT(*) FROM assets`); err != nil {
		return Metrics{}, err
	}
	if totals.CreditsConsumed, err = r.sumJSONInt(ctx, "generation_requested", "credits"); err != nil {
		return Metrics{}, err
	}
	if totals.Last7DayVisits, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'page_view' AND created_at >= ?`, last7Start); err != nil {
		return Metrics{}, err
	}
	if totals.Last7DayUsers, err = r.count(ctx, `SELECT COUNT(*) FROM users WHERE created_at >= ?`, last7Start); err != nil {
		return Metrics{}, err
	}
	if totals.Last7DayRuns, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'generation_requested' AND created_at >= ?`, last7Start); err != nil {
		return Metrics{}, err
	}
	if totals.Last7DayImages, err = r.count(ctx, `SELECT COUNT(*) FROM assets WHERE created_at >= ?`, last7Start); err != nil {
		return Metrics{}, err
	}

	trend := make([]TrendPoint, 0, days)
	for i := 0; i < days; i++ {
		day := start.AddDate(0, 0, i)
		next := day.AddDate(0, 0, 1)
		point := TrendPoint{Date: day.Format("2006-01-02")}
		from := day.Format(time.RFC3339Nano)
		to := next.Format(time.RFC3339Nano)
		if point.Users, err = r.count(ctx, `SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?`, from, to); err != nil {
			return Metrics{}, err
		}
		if point.Visits, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'page_view' AND created_at >= ? AND created_at < ?`, from, to); err != nil {
			return Metrics{}, err
		}
		if point.GenerationRuns, err = r.count(ctx, `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'generation_requested' AND created_at >= ? AND created_at < ?`, from, to); err != nil {
			return Metrics{}, err
		}
		if point.GeneratedImages, err = r.count(ctx, `SELECT COUNT(*) FROM assets WHERE created_at >= ? AND created_at < ?`, from, to); err != nil {
			return Metrics{}, err
		}
		trend = append(trend, point)
	}

	return Metrics{Totals: totals, Trend: trend}, nil
}

func (r *Repository) count(ctx context.Context, query string, args ...interface{}) (int, error) {
	var value int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&value); err != nil {
		return 0, err
	}
	return value, nil
}

func (r *Repository) sumJSONInt(ctx context.Context, eventName, field string) (int, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT metadata FROM analytics_events WHERE event_name = ?`, eventName)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	total := 0
	for rows.Next() {
		var raw string
		if err := rows.Scan(&raw); err != nil {
			return 0, err
		}
		var data map[string]interface{}
		if raw == "" || json.Unmarshal([]byte(raw), &data) != nil {
			continue
		}
		switch value := data[field].(type) {
		case float64:
			total += int(value)
		case int:
			total += value
		}
	}
	return total, rows.Err()
}

func startOfUTCDate(t time.Time) time.Time {
	year, month, day := t.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func nullable(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func newID() string {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}
