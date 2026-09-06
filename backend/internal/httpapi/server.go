package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"milkbuddy/backend/internal/analytics"
	"milkbuddy/backend/internal/assets"
	"milkbuddy/backend/internal/auth"
	"milkbuddy/backend/internal/generation"
)

const maxReferenceImageBytes = 10 << 20

type Server struct {
	auth        *auth.Service
	generations *generation.Service
	assets      *assets.Repository
	analytics   *analytics.Repository
	objects     objectDeleter
	corsOrigin  string
	mux         *http.ServeMux
}

type objectDeleter interface {
	Delete(context.Context, string) error
}

func NewServer(authService *auth.Service, generations *generation.Service, assetRepo *assets.Repository, analyticsRepo *analytics.Repository, objects objectDeleter, corsOrigin string) *Server {
	s := &Server{
		auth:        authService,
		generations: generations,
		assets:      assetRepo,
		analytics:   analyticsRepo,
		objects:     objects,
		corsOrigin:  corsOrigin,
		mux:         http.NewServeMux(),
	}
	s.routes()
	return s
}

func (s *Server) Handler() http.Handler {
	return s.withCORS(s.mux)
}

func (s *Server) routes() {
	s.mux.HandleFunc("GET /api/health", s.health)
	s.mux.HandleFunc("POST /api/auth/register", s.register)
	s.mux.HandleFunc("POST /api/auth/login", s.login)
	s.mux.HandleFunc("POST /api/auth/logout", s.logout)
	s.mux.HandleFunc("GET /api/auth/me", s.me)
	s.mux.HandleFunc("POST /api/events", s.trackEvent)
	s.mux.HandleFunc("GET /api/admin/metrics", s.adminMetrics)
	s.mux.HandleFunc("GET /api/assets", s.listAssets)
	s.mux.HandleFunc("GET /api/assets/{id}", s.getAsset)
	s.mux.HandleFunc("DELETE /api/assets/{id}", s.deleteAsset)
	s.mux.HandleFunc("GET /api/assets/{id}/download", s.downloadAsset)
	s.mux.HandleFunc("POST /api/generations", s.createGeneration)
	s.mux.HandleFunc("POST /api/generations/image-to-image", s.createImageToImageGeneration)
	s.mux.HandleFunc("GET /api/generations/{id}", s.getGeneration)
	s.mux.HandleFunc("GET /api/generations/{id}/images/{index}", s.getGenerationImage)
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var req auth.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	user, session, err := s.auth.Register(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	s.track(r, user.ID, "user_registered", "auth", nil)
	setSessionCookie(w, session)
	writeJSON(w, http.StatusCreated, auth.AuthResponse{User: user})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var req auth.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	user, session, err := s.auth.Login(req)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	s.track(r, user.ID, "user_logged_in", "auth", nil)
	setSessionCookie(w, session)
	writeJSON(w, http.StatusOK, auth.AuthResponse{User: user})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("milkbuddy_session"); err == nil {
		s.auth.DeleteSession(cookie.Value)
	}
	clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	user, ok := s.currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, auth.AuthResponse{User: user})
}

func (s *Server) trackEvent(w http.ResponseWriter, r *http.Request) {
	var req analytics.TrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	userID := ""
	if user, ok := s.currentUser(r); ok {
		userID = user.ID
	}
	s.track(r, userID, req.EventName, req.Page, req.Metadata)
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "accepted"})
}

func (s *Server) adminMetrics(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	if !user.IsAdmin {
		writeError(w, http.StatusForbidden, "admin access required")
		return
	}
	if s.analytics == nil {
		writeError(w, http.StatusServiceUnavailable, "analytics is not configured")
		return
	}
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	metrics, err := s.analytics.Metrics(r.Context(), days)
	if err != nil {
		slog.Warn("load admin metrics failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load metrics")
		return
	}
	writeJSON(w, http.StatusOK, metrics)
}

func (s *Server) createGeneration(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	var req generation.CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.UserID = user.ID

	cost, err := generation.CreditCost(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	creditsRemaining := user.Credits
	if !user.IsAdmin {
		updatedUser, err := s.auth.DebitCredits(user.ID, cost)
		if err != nil {
			writeError(w, http.StatusPaymentRequired, err.Error())
			return
		}
		creditsRemaining = updatedUser.Credits
	}
	chargedCredits := cost
	if user.IsAdmin {
		chargedCredits = 0
	}
	s.track(r, user.ID, "generation_requested", "workspace", map[string]interface{}{
		"mode":        "text-to-image",
		"style_id":    req.StyleID,
		"image_count": req.ImageCount,
		"credits":     chargedCredits,
		"is_admin":    user.IsAdmin,
	})

	job, err := s.generations.Create(r.Context(), req)
	if err != nil {
		if !user.IsAdmin {
			s.auth.AddCredits(user.ID, cost)
		}
		s.track(r, user.ID, "generation_failed", "workspace", map[string]interface{}{
			"mode":     "text-to-image",
			"style_id": req.StyleID,
			"error":    err.Error(),
		})
		slog.Warn("create generation failed", "error", err)
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	job.CreditsRemaining = &creditsRemaining
	writeJSON(w, http.StatusAccepted, job)
}

func (s *Server) createImageToImageGeneration(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxReferenceImageBytes+(1<<20))
	if err := r.ParseMultipartForm(maxReferenceImageBytes); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, header, err := r.FormFile("reference_image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "reference image is required")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxReferenceImageBytes+1))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read reference image")
		return
	}
	if len(data) == 0 {
		writeError(w, http.StatusBadRequest, "reference image is empty")
		return
	}
	if len(data) > maxReferenceImageBytes {
		writeError(w, http.StatusBadRequest, "reference image must be 10MB or smaller")
		return
	}

	contentType := http.DetectContentType(data)
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
		writeError(w, http.StatusBadRequest, "reference image must be jpg, png, or webp")
		return
	}

	seed, _ := strconv.ParseInt(r.FormValue("seed"), 10, 64)
	denoise, _ := strconv.ParseFloat(r.FormValue("denoise"), 64)

	req := generation.ImageToImageRequest{
		CreateRequest: generation.CreateRequest{
			UserID:      user.ID,
			Prompt:      r.FormValue("prompt"),
			StyleID:     r.FormValue("style_id"),
			AspectRatio: r.FormValue("aspect_ratio"),
			Quality:     r.FormValue("quality"),
			ImageCount:  1,
			Seed:        seed,
		},
		ReferenceFilename: header.Filename,
		ReferenceData:     data,
		Denoise:           denoise,
	}

	cost, err := generation.CreditCost(req.CreateRequest)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	creditsRemaining := user.Credits
	if !user.IsAdmin {
		updatedUser, err := s.auth.DebitCredits(user.ID, cost)
		if err != nil {
			writeError(w, http.StatusPaymentRequired, err.Error())
			return
		}
		creditsRemaining = updatedUser.Credits
	}
	chargedCredits := cost
	if user.IsAdmin {
		chargedCredits = 0
	}
	s.track(r, user.ID, "generation_requested", "workspace", map[string]interface{}{
		"mode":        "image-to-image",
		"style_id":    req.StyleID,
		"image_count": req.ImageCount,
		"credits":     chargedCredits,
		"is_admin":    user.IsAdmin,
	})

	job, err := s.generations.CreateImageToImage(r.Context(), req)
	if err != nil {
		if !user.IsAdmin {
			s.auth.AddCredits(user.ID, cost)
		}
		s.track(r, user.ID, "generation_failed", "workspace", map[string]interface{}{
			"mode":     "image-to-image",
			"style_id": req.StyleID,
			"error":    err.Error(),
		})
		slog.Warn("create image-to-image generation failed", "error", err)
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	job.CreditsRemaining = &creditsRemaining
	writeJSON(w, http.StatusAccepted, job)
}

func (s *Server) listAssets(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if pageSize == 0 {
		pageSize, _ = strconv.Atoi(r.URL.Query().Get("limit"))
	}
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 24
	}
	total, err := s.assets.CountByUser(r.Context(), user.ID)
	if err != nil {
		slog.Warn("count assets failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to count assets")
		return
	}
	totalPages := 0
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
		if page > totalPages {
			page = totalPages
		}
	}
	offset := (page - 1) * pageSize

	items, err := s.assets.ListPageByUser(r.Context(), user.ID, pageSize, offset)
	if err != nil {
		slog.Warn("list assets failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list assets")
		return
	}
	writeJSON(w, http.StatusOK, assets.ListResponse{
		Assets:     items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
		HasPrev:    page > 1,
		HasNext:    page < totalPages,
	})
}

func (s *Server) getAsset(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	asset, err := s.assets.GetByUser(r.Context(), r.PathValue("id"), user.ID)
	if err != nil {
		if errors.Is(err, assets.ErrNotFound) {
			writeError(w, http.StatusNotFound, "asset not found")
			return
		}
		slog.Warn("get asset failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get asset")
		return
	}
	writeJSON(w, http.StatusOK, asset)
}

func (s *Server) deleteAsset(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	asset, err := s.assets.GetByUser(r.Context(), r.PathValue("id"), user.ID)
	if err != nil {
		if errors.Is(err, assets.ErrNotFound) {
			writeError(w, http.StatusNotFound, "asset not found")
			return
		}
		slog.Warn("get asset for delete failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get asset")
		return
	}
	if s.objects != nil && asset.StorageKey != "" {
		if err := s.objects.Delete(r.Context(), asset.StorageKey); err != nil {
			slog.Warn("delete stored asset failed", "asset_id", asset.ID, "storage_key", asset.StorageKey, "error", err)
		}
	}
	if err := s.assets.DeleteByUser(r.Context(), asset.ID, user.ID); err != nil {
		if errors.Is(err, assets.ErrNotFound) {
			writeError(w, http.StatusNotFound, "asset not found")
			return
		}
		slog.Warn("delete asset record failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete asset")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) downloadAsset(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	asset, err := s.assets.GetByUser(r.Context(), r.PathValue("id"), user.ID)
	if err != nil {
		if errors.Is(err, assets.ErrNotFound) {
			writeError(w, http.StatusNotFound, "asset not found")
			return
		}
		slog.Warn("get asset for download failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get asset")
		return
	}

	resp, err := http.Get(asset.URL)
	if err != nil {
		slog.Warn("download remote asset failed", "error", err)
		writeError(w, http.StatusBadGateway, "failed to download asset")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		writeError(w, http.StatusBadGateway, "asset storage returned "+resp.Status)
		return
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", `attachment; filename="milkbuddy-asset.png"`)
	w.Header().Set("Cache-Control", "private, max-age=300")
	_, _ = io.Copy(w, resp.Body)
}

func (s *Server) getGeneration(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	job, err := s.generations.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, generation.ErrNotFound) {
			writeError(w, http.StatusNotFound, "generation not found")
			return
		}
		slog.Warn("get generation failed", "error", err)
		writeError(w, http.StatusBadGateway, "failed to query generation")
		return
	}
	if job.UserID != user.ID {
		writeError(w, http.StatusNotFound, "generation not found")
		return
	}
	writeJSON(w, http.StatusOK, job)
}

func (s *Server) getGenerationImage(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	index, err := strconv.Atoi(r.PathValue("index"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid image index")
		return
	}

	job, err := s.generations.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, generation.ErrNotFound) {
			writeError(w, http.StatusNotFound, "image not found")
			return
		}
		slog.Warn("get generation for image failed", "error", err)
		writeError(w, http.StatusBadGateway, "failed to query generation")
		return
	}
	if job.UserID != user.ID {
		writeError(w, http.StatusNotFound, "image not found")
		return
	}

	ref, err := s.generations.ImageRef(r.PathValue("id"), index)
	if err != nil {
		if errors.Is(err, generation.ErrNotFound) {
			writeError(w, http.StatusNotFound, "image not found")
			return
		}
		writeError(w, http.StatusConflict, err.Error())
		return
	}

	data, contentType, err := s.generations.DownloadImage(r.Context(), ref)
	if err != nil {
		slog.Warn("download image failed", "error", err)
		writeError(w, http.StatusBadGateway, "failed to download image")
		return
	}
	if contentType == "" {
		contentType = "image/png"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "private, max-age=3600")
	_, _ = w.Write(data)
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if originAllowed(s.corsOrigin, origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func originAllowed(allowed, origin string) bool {
	if origin == "" {
		return false
	}
	for _, item := range strings.Split(allowed, ",") {
		item = strings.TrimSpace(item)
		if item == "*" || strings.EqualFold(item, origin) {
			return true
		}
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func setSessionCookie(w http.ResponseWriter, session auth.Session) {
	http.SetCookie(w, &http.Cookie{
		Name:     "milkbuddy_session",
		Value:    session.Token,
		Path:     "/",
		Expires:  session.ExpiresAt,
		MaxAge:   int(time.Until(session.ExpiresAt).Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "milkbuddy_session",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0).UTC(),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (s *Server) requireAuth(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	user, ok := s.currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return auth.User{}, false
	}
	return user, true
}

func (s *Server) currentUser(r *http.Request) (auth.User, bool) {
	cookie, err := r.Cookie("milkbuddy_session")
	if err != nil {
		return auth.User{}, false
	}
	return s.auth.UserBySession(cookie.Value)
}

func (s *Server) track(r *http.Request, userID, eventName, page string, metadata map[string]interface{}) {
	if s.analytics == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metadata["method"] = r.Method
	metadata["path"] = r.URL.Path
	if err := s.analytics.Track(ctx, analytics.Event{
		UserID:    userID,
		EventName: eventName,
		Page:      page,
		Metadata:  metadata,
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		slog.Warn("track analytics event failed", "event_name", eventName, "error", err)
	}
}
