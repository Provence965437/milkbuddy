package generation

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"milkbuddy/backend/internal/comfy"
	"milkbuddy/backend/internal/objectstore"
)

type ImageStorage interface {
	Store(context.Context, objectstore.Object) (objectstore.StoredObject, error)
}

type AssetStore interface {
	Create(context.Context, CreateAsset) error
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
	CreatedAt    time.Time
}

type Service struct {
	comfy    *comfy.Client
	storage  ImageStorage
	assets   AssetStore
	template *WorkflowTemplate
	mu       sync.RWMutex
	jobs     map[string]*Job
}

func NewService(comfyClient *comfy.Client, storage ImageStorage, assets AssetStore, template *WorkflowTemplate) *Service {
	return &Service{
		comfy:    comfyClient,
		storage:  storage,
		assets:   assets,
		template: template,
		jobs:     make(map[string]*Job),
	}
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Job, error) {
	params, err := normalize(req)
	if err != nil {
		return nil, err
	}

	workflow, err := s.template.Build(req, params)
	if err != nil {
		return nil, err
	}

	id := newID()
	now := time.Now().UTC()
	job := &Job{
		ID:        id,
		Status:    StatusQueued,
		Prompt:    req.Prompt,
		Params:    params,
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.mu.Lock()
	s.jobs[id] = job
	s.mu.Unlock()

	resp, err := s.comfy.SubmitPrompt(ctx, workflow, "milkbuddy-"+id)
	if err != nil {
		s.markFailed(id, err)
		return nil, err
	}

	s.mu.Lock()
	job.PromptID = resp.PromptID
	job.Status = StatusRunning
	job.UpdatedAt = time.Now().UTC()
	s.mu.Unlock()

	return job, nil
}

func (s *Service) Get(ctx context.Context, id string) (*Job, error) {
	s.mu.RLock()
	job, ok := s.jobs[id]
	s.mu.RUnlock()
	if !ok {
		return nil, ErrNotFound
	}
	if job.PromptID == "" || job.Status == StatusCompleted || job.Status == StatusFailed {
		return cloneJob(job), nil
	}

	history, found, err := s.comfy.History(ctx, job.PromptID)
	if err != nil {
		return nil, err
	}
	if !found {
		return cloneJob(job), nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	job.Status = StatusRunning
	job.UpdatedAt = time.Now().UTC()
	if history.Status.Completed {
		s.mu.Unlock()
		images, err := s.imagesFromOutputs(ctx, job, history.Outputs)
		s.mu.Lock()
		if err != nil {
			job.Status = StatusFailed
			job.Error = err.Error()
			return cloneJob(job), nil
		}
		job.Status = StatusCompleted
		job.Images = images
	}
	if history.Status.StatusStr == "error" {
		job.Status = StatusFailed
		job.Error = "ComfyUI execution failed"
	}
	return cloneJob(job), nil
}

func (s *Service) ImageRef(id string, index int) (comfy.ImageRef, error) {
	s.mu.RLock()
	job, ok := s.jobs[id]
	s.mu.RUnlock()
	if !ok {
		return comfy.ImageRef{}, ErrNotFound
	}
	if job.Status != StatusCompleted {
		return comfy.ImageRef{}, errors.New("job is not completed")
	}
	if index < 0 || index >= len(job.Images) {
		return comfy.ImageRef{}, ErrNotFound
	}

	image := job.Images[index]
	return comfy.ImageRef{
		Filename:  image.Filename,
		Subfolder: image.Subfolder,
		Type:      image.Type,
	}, nil
}

func (s *Service) DownloadImage(ctx context.Context, ref comfy.ImageRef) ([]byte, string, error) {
	return s.comfy.Image(ctx, ref)
}

var ErrNotFound = errors.New("not found")

func normalize(req CreateRequest) (JobParams, error) {
	if strings.TrimSpace(req.Prompt) == "" {
		return JobParams{}, errors.New("prompt is required")
	}
	count := req.ImageCount
	if count == 0 {
		count = 1
	}
	if count < 1 || count > 4 {
		return JobParams{}, errors.New("image_count must be between 1 and 4")
	}
	width, height := dimensions(req.AspectRatio)
	steps := 9
	if req.Quality == "Ultra" {
		steps = 12
	}
	if req.Quality == "Draft" {
		steps = 6
	}
	seed := req.Seed
	if seed == 0 {
		seed = randomSeed()
	}
	return JobParams{
		StyleID:     styleDefinition(req.StyleID).ID,
		AspectRatio: req.AspectRatio,
		Quality:     fallback(req.Quality, "High"),
		ImageCount:  count,
		Seed:        seed,
		Width:       width,
		Height:      height,
		Steps:       steps,
		CFG:         1,
	}, nil
}

func dimensions(ratio string) (int, int) {
	switch ratio {
	case "3:2":
		return 1024, 688
	case "4:5":
		return 832, 1024
	case "21:9":
		return 1280, 544
	default:
		return 1024, 576
	}
}

func (s *Service) imagesFromOutputs(ctx context.Context, job *Job, outputs map[string]comfy.NodeOutput) ([]Image, error) {
	var images []Image
	for _, output := range outputs {
		for _, image := range output.Images {
			index := len(images)
			query := url.Values{}
			query.Set("filename", image.Filename)
			storageKey := ""
			imageURL := fmt.Sprintf("/api/generations/%s/images/%d?%s", job.ID, index, query.Encode())
			if s.storage != nil {
				data, contentType, err := s.comfy.Image(ctx, comfy.ImageRef{
					Filename:  image.Filename,
					Subfolder: image.Subfolder,
					Type:      image.Type,
				})
				if err != nil {
					return nil, err
				}
				stored, err := s.storage.Store(ctx, objectstore.Object{
					Key:         objectKey(job.ID, index, image.Filename),
					Data:        data,
					ContentType: fallback(contentType, "image/png"),
				})
				if err != nil {
					return nil, err
				}
				storageKey = stored.Key
				if stored.URL != "" {
					imageURL = stored.URL
				}
			}
			images = append(images, Image{
				Index:      index,
				URL:        imageURL,
				Filename:   image.Filename,
				Subfolder:  image.Subfolder,
				Type:       image.Type,
				StorageKey: storageKey,
			})
			if s.assets != nil {
				err := s.assets.Create(ctx, CreateAsset{
					ID:           newID(),
					GenerationID: job.ID,
					ImageIndex:   index,
					URL:          imageURL,
					StorageKey:   storageKey,
					Filename:     image.Filename,
					StyleID:      job.Params.StyleID,
					AspectRatio:  job.Params.AspectRatio,
					Quality:      job.Params.Quality,
					Width:        job.Params.Width,
					Height:       job.Params.Height,
					Seed:         job.Params.Seed,
					Prompt:       job.Prompt,
					CreatedAt:    time.Now().UTC(),
				})
				if err != nil {
					return nil, err
				}
			}
		}
	}
	return images, nil
}

func fallback(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func objectKey(jobID string, index int, filename string) string {
	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".png"
	}
	return fmt.Sprintf("generations/%s/%02d%s", jobID, index+1, ext)
}

func newID() string {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}

func randomSeed() int64 {
	n, err := rand.Int(rand.Reader, big.NewInt(900000000000000))
	if err != nil {
		return time.Now().UnixNano()
	}
	return n.Int64() + 100000000000000
}

func (s *Service) markFailed(id string, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if job := s.jobs[id]; job != nil {
		job.Status = StatusFailed
		job.Error = err.Error()
		job.UpdatedAt = time.Now().UTC()
	}
}

func cloneJob(job *Job) *Job {
	copy := *job
	copy.Images = append([]Image(nil), job.Images...)
	return &copy
}
