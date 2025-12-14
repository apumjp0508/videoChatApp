package modelinfo

type ModelInfo struct {
	Type    string `json:"type"`    // "model-info"
	URL     string `json:"url"`     // モデルファイルURL
	Version string `json:"version"` // バージョンなど
}


