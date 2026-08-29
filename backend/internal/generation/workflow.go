package generation

import (
	"encoding/json"
	"os"
	"path/filepath"
)

const qwenEditSingleWorkflowFile = "qwen_edit_2511_single_img2img_api.json"

type WorkflowTemplate struct {
	path string
}

func NewWorkflowTemplate(path string) *WorkflowTemplate {
	return &WorkflowTemplate{path: path}
}

func (t *WorkflowTemplate) Build(req CreateRequest, params JobParams) (map[string]interface{}, error) {
	style := styleDefinition(req.StyleID)
	data, err := os.ReadFile(t.pathFor(style))
	if err != nil {
		return nil, err
	}

	var workflow map[string]interface{}
	if err := json.Unmarshal(data, &workflow); err != nil {
		return nil, err
	}

	style.Configure(workflow)
	setInput(workflow, "57:27", "text", buildPrompt(req))
	setInput(workflow, "57:13", "width", params.Width)
	setInput(workflow, "57:13", "height", params.Height)
	setInput(workflow, "57:13", "batch_size", params.ImageCount)
	setInput(workflow, "57:3", "seed", params.Seed)
	setInput(workflow, "57:3", "steps", params.Steps)
	setInput(workflow, "57:3", "cfg", params.CFG)

	return workflow, nil
}

func (t *WorkflowTemplate) BuildImageToImage(req CreateRequest, params JobParams, imageName string) (map[string]interface{}, error) {
	data, err := os.ReadFile(filepath.Join(filepath.Dir(t.path), qwenEditSingleWorkflowFile))
	if err != nil {
		return nil, err
	}

	var workflow map[string]interface{}
	if err := json.Unmarshal(data, &workflow); err != nil {
		return nil, err
	}

	setInput(workflow, "218", "prompt", req.Prompt)
	setInput(workflow, "219", "image", imageName)
	setInput(workflow, "194", "seed", params.Seed)
	setInput(workflow, "194", "steps", 4)
	setInput(workflow, "194", "cfg", 1)
	setInput(workflow, "194", "denoise", 1)
	setInput(workflow, "208", "value", 1280)
	setInput(workflow, "216", "filename_prefix", "milkbuddy-qwen-edit")

	return workflow, nil
}

func (t *WorkflowTemplate) pathFor(style StyleDefinition) string {
	if style.WorkflowFile == "" {
		return t.path
	}
	return filepath.Join(filepath.Dir(t.path), style.WorkflowFile)
}

func setInput(workflow map[string]interface{}, nodeID, key string, value interface{}) {
	node, ok := workflow[nodeID].(map[string]interface{})
	if !ok {
		return
	}
	inputs, ok := node["inputs"].(map[string]interface{})
	if !ok {
		return
	}
	inputs[key] = value
}

func buildPrompt(req CreateRequest) string {
	style := styleDefinition(req.StyleID)
	if style.PromptPrefix == "" {
		return req.Prompt
	}
	return style.PromptPrefix + ", " + req.Prompt
}
