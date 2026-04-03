use serde::{Deserialize, Serialize};

// ── Data types for the v2 multi-file format ──

#[derive(Deserialize)]
pub struct SaveManifest {
    pub project: ProjectMeta,
    pub palettes: Vec<PaletteMeta>,
    pub spritesheets: Vec<SpritesheetManifest>,
    pub deleted_spritesheets: Vec<String>,
    pub deleted_palettes: Vec<String>,
    pub write_gitignore: bool,
}

#[derive(Deserialize, Serialize)]
pub struct ProjectMeta {
    pub id: String,
    pub name: String,
    #[serde(rename = "defaultCanvasSize")]
    pub default_canvas_size: CanvasSize,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct CanvasSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Deserialize, Serialize)]
pub struct PaletteMeta {
    pub id: String,
    pub name: String,
    pub colors: Vec<String>,
}

#[derive(Deserialize)]
pub struct SpritesheetManifest {
    pub id: String,
    pub name: String,
    pub animations: Vec<AnimationMeta>,
    pub images: Vec<ReferenceImageMeta>,
    pub frames: Vec<FrameManifest>,
    pub deleted_animations: Vec<String>,
    pub deleted_frames: Vec<String>,
    pub deleted_images: Vec<String>,
}

#[derive(Deserialize, Serialize)]
pub struct AnimationMeta {
    pub id: String,
    pub name: String,
    #[serde(rename = "canvasSize", skip_serializing_if = "Option::is_none")]
    pub canvas_size: Option<CanvasSize>,
    pub keyframes: Vec<KeyframeMeta>,
}

#[derive(Deserialize, Serialize)]
pub struct ReferenceImageMeta {
    pub id: String,
    pub name: String,
    #[serde(rename = "canvasSize", skip_serializing_if = "Option::is_none")]
    pub canvas_size: Option<CanvasSize>,
    #[serde(rename = "frameId")]
    pub frame_id: String,
}

#[derive(Deserialize, Serialize)]
pub struct KeyframeMeta {
    pub id: String,
    pub time: f64,
    #[serde(rename = "frameId")]
    pub frame_id: String,
}

#[derive(Deserialize)]
pub struct FrameManifest {
    pub id: String,
    #[serde(rename = "layerOrder")]
    pub layer_order: Vec<String>,
    pub layers: Vec<LayerManifest>,
    pub deleted_layers: Vec<String>,
}

#[derive(Deserialize)]
pub struct LayerManifest {
    pub id: String,
    pub name: String,
    pub opacity: f64,
    #[serde(rename = "blendMode")]
    pub blend_mode: String,
    pub visible: bool,
    pub locked: bool,
    #[serde(rename = "isReference")]
    pub is_reference: bool,
    /// Base64-encoded PNG data (data URL or raw base64)
    pub data: String,
}

#[derive(Serialize, Deserialize)]
pub struct LayerMetaJson {
    pub id: String,
    pub name: String,
    pub opacity: f64,
    #[serde(rename = "blendMode")]
    pub blend_mode: String,
    pub visible: bool,
    pub locked: bool,
    #[serde(rename = "isReference")]
    pub is_reference: bool,
}

#[derive(Serialize, Deserialize)]
pub struct FrameMetaJson {
    pub id: String,
    #[serde(rename = "layerOrder")]
    pub layer_order: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SpritesheetMetaJson {
    pub id: String,
    pub name: String,
}

// ── Load v2 response types ──

#[derive(Serialize)]
pub struct LoadedProject {
    pub id: String,
    pub name: String,
    #[serde(rename = "defaultCanvasSize")]
    pub default_canvas_size: CanvasSize,
    pub palettes: Vec<PaletteMeta>,
    pub spritesheets: Vec<LoadedSpritesheet>,
}

#[derive(Serialize)]
pub struct LoadedSpritesheet {
    pub id: String,
    pub name: String,
    pub animations: Vec<AnimationMeta>,
    pub images: Vec<ReferenceImageMeta>,
    pub frames: Vec<LoadedFrame>,
}

#[derive(Serialize)]
pub struct LoadedFrame {
    pub id: String,
    pub layers: Vec<LoadedLayer>,
}

#[derive(Serialize)]
pub struct LoadedLayer {
    pub id: String,
    pub name: String,
    pub opacity: f64,
    #[serde(rename = "blendMode")]
    pub blend_mode: String,
    pub visible: bool,
    pub locked: bool,
    #[serde(rename = "isReference")]
    pub is_reference: bool,
    pub data: String,
}
