package comfy

type ImageRef struct {
	Filename  string `json:"filename"`
	Subfolder string `json:"subfolder"`
	Type      string `json:"type"`
}

type SubmitResponse struct {
	PromptID   string                 `json:"prompt_id"`
	Number     int                    `json:"number"`
	NodeErrors map[string]interface{} `json:"node_errors"`
}

type HistoryResponse map[string]HistoryItem

type HistoryItem struct {
	Outputs map[string]NodeOutput `json:"outputs"`
	Status  ExecutionStatus       `json:"status"`
}

type NodeOutput struct {
	Images []ImageRef `json:"images"`
}

type ExecutionStatus struct {
	StatusStr string `json:"status_str"`
	Completed bool   `json:"completed"`
}
