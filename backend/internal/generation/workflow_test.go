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
