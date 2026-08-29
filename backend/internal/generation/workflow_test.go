package generation

import "testing"

func TestUltimateBishoujoWorkflowRemovesLora(t *testing.T) {
	template := NewWorkflowTemplate("../../configs/workflows/z_image_turbo.json")
	workflow, err := template.Build(CreateRequest{
		Prompt:  "test prompt",
		StyleID: "ultimate_bishoujo",
	}, JobParams{
		Width:      832,
		Height:     1024,
		ImageCount: 1,
		Seed:       1,
		Steps:      9,
		CFG:        1,
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, ok := workflow["57:62"]; ok {
		t.Fatal("ultimate_bishoujo workflow should not include AnimeLora3 node")
	}
	if got := input(t, workflow, "57:28", "unet_name"); got != "z-image-ultimate-nsfw-unlock-turbo.safetensors" {
		t.Fatalf("unexpected unet_name: %v", got)
	}
	assertLink(t, input(t, workflow, "57:27", "clip"), "57:30", 0)
	assertLink(t, input(t, workflow, "57:11", "model"), "57:28", 0)
}

func TestAnimeBishoujoPromptUsesStylePrefix(t *testing.T) {
	template := NewWorkflowTemplate("../../configs/workflows/z_image_turbo.json")
	workflow, err := template.Build(CreateRequest{
		Prompt:  "blue eyes",
		StyleID: "anime_bishoujo",
	}, JobParams{
		Width:      832,
		Height:     1024,
		ImageCount: 1,
		Seed:       1,
		Steps:      9,
		CFG:        1,
	})
	if err != nil {
		t.Fatal(err)
	}

	want := "animestyled, uniquanime, Digital anime-style drawing, blue eyes"
	if got := input(t, workflow, "57:27", "text"); got != want {
		t.Fatalf("unexpected prompt: %v", got)
	}
}

func TestAnimeBishoujoUltimateUsesAnimePromptWithoutLora(t *testing.T) {
	template := NewWorkflowTemplate("../../configs/workflows/z_image_turbo.json")
	workflow, err := template.Build(CreateRequest{
		Prompt:  "blue eyes",
		StyleID: "anime_bishoujo_ultimate",
	}, JobParams{
		Width:      832,
		Height:     1024,
		ImageCount: 1,
		Seed:       1,
		Steps:      9,
		CFG:        1,
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, ok := workflow["57:62"]; ok {
		t.Fatal("anime_bishoujo_ultimate workflow should not include AnimeLora3 node")
	}
	if got := input(t, workflow, "57:28", "unet_name"); got != "z-image-ultimate-nsfw-unlock-turbo.safetensors" {
		t.Fatalf("unexpected unet_name: %v", got)
	}
	if got := input(t, workflow, "57:27", "text"); got != "animestyled, uniquanime, Digital anime-style drawing, blue eyes" {
		t.Fatalf("unexpected prompt: %v", got)
	}
	assertLink(t, input(t, workflow, "57:27", "clip"), "57:30", 0)
	assertLink(t, input(t, workflow, "57:11", "model"), "57:28", 0)
}

func TestUltimateBishoujoPromptHasNoStylePrefix(t *testing.T) {
	template := NewWorkflowTemplate("../../configs/workflows/z_image_turbo.json")
	workflow, err := template.Build(CreateRequest{
		Prompt:  "blue eyes",
		StyleID: "ultimate_bishoujo",
	}, JobParams{
		Width:      832,
		Height:     1024,
		ImageCount: 1,
		Seed:       1,
		Steps:      9,
		CFG:        1,
	})
	if err != nil {
		t.Fatal(err)
	}

	if got := input(t, workflow, "57:27", "text"); got != "blue eyes" {
		t.Fatalf("unexpected prompt: %v", got)
	}
}

func TestQwenImageEditSingleWorkflowUsesReferenceAndPrompt(t *testing.T) {
	template := NewWorkflowTemplate("../../configs/workflows/z_image_turbo.json")
	workflow, err := template.BuildImageToImage(CreateRequest{
		Prompt: "turn her hair red",
	}, JobParams{
		Width:  832,
		Height: 1024,
		Seed:   123,
	}, "uploaded-reference.png")
	if err != nil {
		t.Fatal(err)
	}

	if _, ok := workflow["230"]; ok {
		t.Fatal("single image edit workflow should not include two-image branch")
	}
	if _, ok := workflow["264"]; ok {
		t.Fatal("single image edit workflow should not include three-image branch")
	}
	if got := input(t, workflow, "218", "prompt"); got != "turn her hair red" {
		t.Fatalf("unexpected edit prompt: %v", got)
	}
	if got := input(t, workflow, "219", "image"); got != "uploaded-reference.png" {
		t.Fatalf("unexpected reference image: %v", got)
	}
	if got := input(t, workflow, "194", "seed"); got != int64(123) {
		t.Fatalf("unexpected seed: %v", got)
	}
	if got := input(t, workflow, "194", "denoise"); got != 1 {
		t.Fatalf("unexpected denoise: %v", got)
	}
	if got := input(t, workflow, "208", "value"); got != 1280 {
		t.Fatalf("unexpected scale length: %v", got)
	}
	if got := input(t, workflow, "310", "lora_name"); got != "Qwen_Image_Edit_2511_All_included_with_extra_gay_v2.0.safetensors" {
		t.Fatalf("unexpected extra lora name: %v", got)
	}
	assertLink(t, input(t, workflow, "310", "model"), "187", 0)
	assertLink(t, input(t, workflow, "190", "model"), "310", 0)
	assertLink(t, input(t, workflow, "216", "images"), "195", 0)
}

func input(t *testing.T, workflow map[string]interface{}, nodeID, key string) interface{} {
	t.Helper()
	node, ok := workflow[nodeID].(map[string]interface{})
	if !ok {
		t.Fatalf("node %s missing", nodeID)
	}
	inputs, ok := node["inputs"].(map[string]interface{})
	if !ok {
		t.Fatalf("node %s inputs missing", nodeID)
	}
	return inputs[key]
}

func assertLink(t *testing.T, value interface{}, nodeID string, output int) {
	t.Helper()
	link, ok := value.([]interface{})
	if !ok || len(link) != 2 {
		t.Fatalf("expected link, got %#v", value)
	}
	if link[0] != nodeID {
		t.Fatalf("expected link node %s, got %#v", nodeID, link[0])
	}
	if link[1] != float64(output) && link[1] != output {
		t.Fatalf("expected link output %d, got %#v", output, link[1])
	}
}
