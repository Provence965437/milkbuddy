package generation

type StyleDefinition struct {
	ID           string
	WorkflowFile string
	PromptPrefix string
	Configure    func(map[string]interface{})
}

func styleDefinition(id string) StyleDefinition {
	if style, ok := styleDefinitions()[id]; ok {
		return style
	}
	return styleDefinitions()["anime_bishoujo"]
}

func styleDefinitions() map[string]StyleDefinition {
	return map[string]StyleDefinition{
		"anime_bishoujo": {
			ID:           "anime_bishoujo",
			WorkflowFile: "",
			PromptPrefix: "animestyled, uniquanime, Digital anime-style drawing",
			Configure:    func(map[string]interface{}) {},
		},
		"anime_bishoujo_ultimate": {
			ID:           "anime_bishoujo_ultimate",
			WorkflowFile: "",
			PromptPrefix: "animestyled, uniquanime, Digital anime-style drawing",
			Configure: func(workflow map[string]interface{}) {
				delete(workflow, "57:62")
				setInput(workflow, "57:28", "unet_name", "z-image-ultimate-nsfw-unlock-turbo.safetensors")
				setInput(workflow, "57:27", "clip", []interface{}{"57:30", 0})
				setInput(workflow, "57:11", "model", []interface{}{"57:28", 0})
			},
		},
		"ultimate_bishoujo": {
			ID:           "ultimate_bishoujo",
			WorkflowFile: "girl_ultimate.json",
			PromptPrefix: "",
			Configure:    func(map[string]interface{}) {},
		},
	}
}
