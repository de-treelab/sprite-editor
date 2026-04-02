use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::Command;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use image::ImageEncoder;
use serde::{Deserialize, Serialize};

// ── Data types for the v2 multi-file format ──

#[derive(Deserialize)]
struct SaveManifest {
    project: ProjectMeta,
    palettes: Vec<PaletteMeta>,
    spritesheets: Vec<SpritesheetManifest>,
    deleted_spritesheets: Vec<String>,
    deleted_palettes: Vec<String>,
    write_gitignore: bool,
}

#[derive(Deserialize, Serialize)]
struct ProjectMeta {
    id: String,
    name: String,
    #[serde(rename = "defaultCanvasSize")]
    default_canvas_size: CanvasSize,
}

#[derive(Deserialize, Serialize, Clone)]
struct CanvasSize {
    width: u32,
    height: u32,
}

#[derive(Deserialize, Serialize)]
struct PaletteMeta {
    id: String,
    name: String,
    colors: Vec<String>,
}

#[derive(Deserialize)]
struct SpritesheetManifest {
    id: String,
    name: String,
    animations: Vec<AnimationMeta>,
    frames: Vec<FrameManifest>,
    deleted_animations: Vec<String>,
    deleted_frames: Vec<String>,
}

#[derive(Deserialize, Serialize)]
struct AnimationMeta {
    id: String,
    name: String,
    #[serde(rename = "canvasSize", skip_serializing_if = "Option::is_none")]
    canvas_size: Option<CanvasSize>,
    keyframes: Vec<KeyframeMeta>,
}

#[derive(Deserialize, Serialize)]
struct KeyframeMeta {
    id: String,
    time: f64,
    #[serde(rename = "frameId")]
    frame_id: String,
}

#[derive(Deserialize)]
struct FrameManifest {
    id: String,
    layers: Vec<LayerManifest>,
    deleted_layers: Vec<String>,
}

#[derive(Deserialize)]
struct LayerManifest {
    id: String,
    name: String,
    opacity: f64,
    #[serde(rename = "blendMode")]
    blend_mode: String,
    visible: bool,
    locked: bool,
    #[serde(rename = "isReference")]
    is_reference: bool,
    /// Base64-encoded PNG data (data URL or raw base64)
    data: String,
}

#[derive(Serialize, Deserialize)]
struct LayerMetaJson {
    id: String,
    name: String,
    opacity: f64,
    #[serde(rename = "blendMode")]
    blend_mode: String,
    visible: bool,
    locked: bool,
    #[serde(rename = "isReference")]
    is_reference: bool,
}

#[derive(Serialize, Deserialize)]
struct FrameMetaJson {
    id: String,
    #[serde(rename = "layerOrder")]
    layer_order: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct SpritesheetMetaJson {
    id: String,
    name: String,
}

// ── Load v2 response types ──

#[derive(Serialize)]
struct LoadedProject {
    id: String,
    name: String,
    #[serde(rename = "defaultCanvasSize")]
    default_canvas_size: CanvasSize,
    palettes: Vec<PaletteMeta>,
    spritesheets: Vec<LoadedSpritesheet>,
}

#[derive(Serialize)]
struct LoadedSpritesheet {
    id: String,
    name: String,
    animations: Vec<AnimationMeta>,
    frames: Vec<LoadedFrame>,
}

#[derive(Serialize)]
struct LoadedFrame {
    id: String,
    layers: Vec<LoadedLayer>,
}

#[derive(Serialize)]
struct LoadedLayer {
    id: String,
    name: String,
    opacity: f64,
    #[serde(rename = "blendMode")]
    blend_mode: String,
    visible: bool,
    locked: bool,
    #[serde(rename = "isReference")]
    is_reference: bool,
    data: String, // base64 data URL
}

// ── Helper: decode base64 data URL to raw PNG bytes ──

fn decode_data_url_to_png(data: &str, width: u32, height: u32) -> Result<Vec<u8>, String> {
    // Strip data URL prefix if present
    let b64 = if let Some(pos) = data.find(",") {
        &data[pos + 1..]
    } else {
        data
    };

    if b64.is_empty() {
        // Return a transparent PNG for empty data
        return create_transparent_png(width, height);
    }

    let raw_bytes = BASE64.decode(b64).map_err(|e| format!("Base64 decode error: {}", e))?;

    // Check if it's already a valid PNG (starts with PNG magic bytes)
    if raw_bytes.len() >= 8 && &raw_bytes[0..4] == b"\x89PNG" {
        return Ok(raw_bytes);
    }

    // It's raw RGBA pixel data — encode as PNG
    let expected_len = (width * height * 4) as usize;
    if raw_bytes.len() != expected_len {
        // Try to interpret as PNG anyway (might be a different image format encoded in base64)
        if let Ok(img) = image::load_from_memory(&raw_bytes) {
            let mut png_bytes = Vec::new();
            let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
            let rgba = img.to_rgba8();
            encoder
                .write_image(
                    rgba.as_raw(),
                    rgba.width(),
                    rgba.height(),
                    image::ExtendedColorType::Rgba8,
                )
                .map_err(|e| format!("PNG encode error: {}", e))?;
            return Ok(png_bytes);
        }
        return Err(format!(
            "Unexpected raw data length: got {} expected {}",
            raw_bytes.len(),
            expected_len
        ));
    }

    let mut png_bytes = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(&raw_bytes, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("PNG encode error: {}", e))?;
    Ok(png_bytes)
}

fn create_transparent_png(width: u32, height: u32) -> Result<Vec<u8>, String> {
    let pixel_data = vec![0u8; (width * height * 4) as usize];
    let mut png_bytes = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(&pixel_data, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("PNG encode error: {}", e))?;
    Ok(png_bytes)
}

fn png_file_to_data_url(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
    let b64 = BASE64.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", b64))
}

/// Reads an image file (PNG, JPEG, BMP, WebP, GIF), converts it to a PNG data-URL,
/// and returns `{ dataUrl, width, height }`.
#[derive(Serialize)]
struct ImportedImage {
    data_url: String,
    width: u32,
    height: u32,
}

#[tauri::command]
fn import_image(path: String) -> Result<ImportedImage, String> {
    let img = image::open(&path).map_err(|e| format!("Failed to open image: {}", e))?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();

    let mut png_bytes = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(rgba.as_raw(), width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("PNG encode error: {}", e))?;

    let b64 = BASE64.encode(&png_bytes);
    Ok(ImportedImage {
        data_url: format!("data:image/png;base64,{}", b64),
        width,
        height,
    })
}

// ── Existing commands (kept for backward compatibility) ──

#[tauri::command]
fn check_folder_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
fn save_project(path: String, project_json: String) -> Result<(), String> {
    let file_path = Path::new(&path).join("project.json");
    if !Path::new(&path).exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    fs::write(file_path, project_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_project(path: String) -> Result<String, String> {
    let file_path = Path::new(&path).join("project.json");
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// ── V2 save: multi-file format ──

#[tauri::command]
fn save_project_v2(path: String, manifest_json: String) -> Result<(), String> {
    let manifest: SaveManifest =
        serde_json::from_str(&manifest_json).map_err(|e| format!("Invalid manifest: {}", e))?;

    let root = Path::new(&path);
    fs::create_dir_all(root).map_err(|e| e.to_string())?;

    // Write project.json (slim root)
    let project_json =
        serde_json::to_string_pretty(&manifest.project).map_err(|e| e.to_string())?;
    fs::write(root.join("project.json"), project_json).map_err(|e| e.to_string())?;

    // Write .gitignore if requested
    if manifest.write_gitignore {
        let gitignore_path = root.join(".gitignore");
        if !gitignore_path.exists() {
            fs::write(
                gitignore_path,
                "# Editor temp files\n*.tmp\n*.swp\n.DS_Store\nThumbs.db\n",
            )
            .map_err(|e| e.to_string())?;
        }
    }

    // Write palettes
    let palettes_dir = root.join("palettes");
    if !manifest.palettes.is_empty() {
        fs::create_dir_all(&palettes_dir).map_err(|e| e.to_string())?;
    }
    for palette in &manifest.palettes {
        let pj = serde_json::to_string_pretty(palette).map_err(|e| e.to_string())?;
        fs::write(palettes_dir.join(format!("{}.json", palette.id)), pj)
            .map_err(|e| e.to_string())?;
    }

    // Delete removed palettes
    for pid in &manifest.deleted_palettes {
        let ppath = palettes_dir.join(format!("{}.json", pid));
        if ppath.exists() {
            fs::remove_file(ppath).map_err(|e| e.to_string())?;
        }
    }

    // Write spritesheets
    let sheets_dir = root.join("spritesheets");
    for sheet in &manifest.spritesheets {
        let sheet_dir = sheets_dir.join(&sheet.id);
        fs::create_dir_all(&sheet_dir).map_err(|e| e.to_string())?;

        // spritesheet.json
        let smeta = SpritesheetMetaJson {
            id: sheet.id.clone(),
            name: sheet.name.clone(),
        };
        let sj = serde_json::to_string_pretty(&smeta).map_err(|e| e.to_string())?;
        fs::write(sheet_dir.join("spritesheet.json"), sj).map_err(|e| e.to_string())?;

        // Write animations
        let anims_dir = sheet_dir.join("animations");
        if !sheet.animations.is_empty() {
            fs::create_dir_all(&anims_dir).map_err(|e| e.to_string())?;
        }
        for anim in &sheet.animations {
            let aj = serde_json::to_string_pretty(anim).map_err(|e| e.to_string())?;
            fs::write(anims_dir.join(format!("{}.json", anim.id)), aj)
                .map_err(|e| e.to_string())?;
        }

        // Delete removed animations
        for aid in &sheet.deleted_animations {
            let apath = anims_dir.join(format!("{}.json", aid));
            if apath.exists() {
                fs::remove_file(apath).map_err(|e| e.to_string())?;
            }
        }

        // Write frames
        let frames_dir = sheet_dir.join("frames");
        for frame in &sheet.frames {
            let frame_dir = frames_dir.join(&frame.id);
            let layers_dir = frame_dir.join("layers");
            fs::create_dir_all(&layers_dir).map_err(|e| e.to_string())?;

            // frame.json with layer order
            let fmeta = FrameMetaJson {
                id: frame.id.clone(),
                layer_order: frame.layers.iter().map(|l| l.id.clone()).collect(),
            };
            let fj = serde_json::to_string_pretty(&fmeta).map_err(|e| e.to_string())?;
            fs::write(frame_dir.join("frame.json"), fj).map_err(|e| e.to_string())?;

            // Write each layer
            for layer in &frame.layers {
                // Layer metadata
                let lmeta = LayerMetaJson {
                    id: layer.id.clone(),
                    name: layer.name.clone(),
                    opacity: layer.opacity,
                    blend_mode: layer.blend_mode.clone(),
                    visible: layer.visible,
                    locked: layer.locked,
                    is_reference: layer.is_reference,
                };
                let lj = serde_json::to_string_pretty(&lmeta).map_err(|e| e.to_string())?;
                fs::write(layers_dir.join(format!("{}.json", layer.id)), lj)
                    .map_err(|e| e.to_string())?;

                // Layer pixel data → PNG
                // We need the canvas size to encode raw RGBA. Use project default.
                let w = manifest.project.default_canvas_size.width;
                let h = manifest.project.default_canvas_size.height;
                let png_bytes = decode_data_url_to_png(&layer.data, w, h)?;
                fs::write(layers_dir.join(format!("{}.png", layer.id)), png_bytes)
                    .map_err(|e| e.to_string())?;
            }

            // Delete removed layers
            for lid in &frame.deleted_layers {
                let ljson = layers_dir.join(format!("{}.json", lid));
                let lpng = layers_dir.join(format!("{}.png", lid));
                if ljson.exists() {
                    fs::remove_file(ljson).map_err(|e| e.to_string())?;
                }
                if lpng.exists() {
                    fs::remove_file(lpng).map_err(|e| e.to_string())?;
                }
            }
        }

        // Delete removed frames
        for fid in &sheet.deleted_frames {
            let fdir = frames_dir.join(fid);
            if fdir.exists() {
                fs::remove_dir_all(fdir).map_err(|e| e.to_string())?;
            }
        }
    }

    // Delete removed spritesheets
    for sid in &manifest.deleted_spritesheets {
        let sdir = sheets_dir.join(sid);
        if sdir.exists() {
            fs::remove_dir_all(sdir).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// ── V2 load: reassemble from multi-file format ──

#[tauri::command]
fn load_project_v2(path: String) -> Result<String, String> {
    let root = Path::new(&path);
    let project_json_path = root.join("project.json");

    if !project_json_path.exists() {
        return Err("No project.json found".to_string());
    }

    let project_str =
        fs::read_to_string(&project_json_path).map_err(|e| e.to_string())?;

    // Try to detect old monolithic format (has "spritesheets" key with data)
    let raw: serde_json::Value =
        serde_json::from_str(&project_str).map_err(|e| e.to_string())?;

    if raw.get("spritesheets").is_some() {
        // Old format — return as-is, frontend handles migration
        return Ok(project_str);
    }

    // New v2 format — reassemble from directory tree
    let meta: ProjectMeta =
        serde_json::from_value(raw).map_err(|e| format!("Invalid project.json: {}", e))?;

    // Load palettes
    let mut palettes: Vec<PaletteMeta> = Vec::new();
    let palettes_dir = root.join("palettes");
    if palettes_dir.exists() {
        for entry in fs::read_dir(&palettes_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let p = entry.path();
            if p.extension().and_then(|e| e.to_str()) == Some("json") {
                let content = fs::read_to_string(&p).map_err(|e| e.to_string())?;
                let palette: PaletteMeta =
                    serde_json::from_str(&content).map_err(|e| e.to_string())?;
                palettes.push(palette);
            }
        }
    }

    // Load spritesheets
    let mut spritesheets: Vec<LoadedSpritesheet> = Vec::new();
    let sheets_dir = root.join("spritesheets");
    if sheets_dir.exists() {
        for entry in fs::read_dir(&sheets_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let sheet_dir = entry.path();
            if !sheet_dir.is_dir() {
                continue;
            }

            let smeta_path = sheet_dir.join("spritesheet.json");
            if !smeta_path.exists() {
                continue;
            }
            let smeta_str = fs::read_to_string(&smeta_path).map_err(|e| e.to_string())?;
            let smeta: SpritesheetMetaJson =
                serde_json::from_str(&smeta_str).map_err(|e| e.to_string())?;

            // Load animations
            let mut animations: Vec<AnimationMeta> = Vec::new();
            let anims_dir = sheet_dir.join("animations");
            if anims_dir.exists() {
                for aentry in fs::read_dir(&anims_dir).map_err(|e| e.to_string())? {
                    let aentry = aentry.map_err(|e| e.to_string())?;
                    let apath = aentry.path();
                    if apath.extension().and_then(|e| e.to_str()) == Some("json") {
                        let acontent = fs::read_to_string(&apath).map_err(|e| e.to_string())?;
                        let anim: AnimationMeta =
                            serde_json::from_str(&acontent).map_err(|e| e.to_string())?;
                        animations.push(anim);
                    }
                }
            }

            // Load frames
            let mut frames: Vec<LoadedFrame> = Vec::new();
            let frames_dir = sheet_dir.join("frames");
            if frames_dir.exists() {
                for fentry in fs::read_dir(&frames_dir).map_err(|e| e.to_string())? {
                    let fentry = fentry.map_err(|e| e.to_string())?;
                    let frame_dir = fentry.path();
                    if !frame_dir.is_dir() {
                        continue;
                    }

                    let fmeta_path = frame_dir.join("frame.json");
                    if !fmeta_path.exists() {
                        continue;
                    }
                    let fmeta_str =
                        fs::read_to_string(&fmeta_path).map_err(|e| e.to_string())?;
                    let fmeta: FrameMetaJson =
                        serde_json::from_str(&fmeta_str).map_err(|e| e.to_string())?;

                    // Load layers in order specified by layerOrder
                    let layers_dir = frame_dir.join("layers");
                    let mut layers: Vec<LoadedLayer> = Vec::new();

                    for layer_id in &fmeta.layer_order {
                        let lmeta_path = layers_dir.join(format!("{}.json", layer_id));
                        let lpng_path = layers_dir.join(format!("{}.png", layer_id));

                        if !lmeta_path.exists() {
                            continue;
                        }

                        let lmeta_str =
                            fs::read_to_string(&lmeta_path).map_err(|e| e.to_string())?;
                        let lmeta: LayerMetaJson =
                            serde_json::from_str(&lmeta_str).map_err(|e| e.to_string())?;

                        let data = if lpng_path.exists() {
                            png_file_to_data_url(&lpng_path)?
                        } else {
                            String::new()
                        };

                        layers.push(LoadedLayer {
                            id: lmeta.id,
                            name: lmeta.name,
                            opacity: lmeta.opacity,
                            blend_mode: lmeta.blend_mode,
                            visible: lmeta.visible,
                            locked: lmeta.locked,
                            is_reference: lmeta.is_reference,
                            data,
                        });
                    }

                    frames.push(LoadedFrame {
                        id: fmeta.id,
                        layers,
                    });
                }
            }

            spritesheets.push(LoadedSpritesheet {
                id: smeta.id,
                name: smeta.name,
                animations,
                frames,
            });
        }
    }

    let loaded = LoadedProject {
        id: meta.id,
        name: meta.name,
        default_canvas_size: meta.default_canvas_size,
        palettes,
        spritesheets,
    };

    serde_json::to_string(&loaded).map_err(|e| e.to_string())
}

// ── Git commands ──

#[tauri::command]
fn git_init(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("init")
        .output()
        .map_err(|e| e.to_string())?;
        
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_commit(path: String, message: String) -> Result<String, String> {
    Command::new("git")
        .current_dir(&path)
        .args(["add", "."])
        .output()
        .map_err(|e| e.to_string())?;
        
    let output = Command::new("git")
        .current_dir(&path)
        .args(["commit", "-m", &message])
        .output()
        .map_err(|e| e.to_string())?;
        
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        // "nothing to commit" is not an error
        if stderr.contains("nothing to commit") || String::from_utf8_lossy(&output.stdout).contains("nothing to commit") {
            Ok("nothing to commit".to_string())
        } else {
            Err(stderr)
        }
    }
}

#[tauri::command]
fn git_status(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .arg("status")
        .output()
        .map_err(|e| e.to_string())?;
        
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_log(path: String) -> Result<Vec<String>, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["log", "--pretty=format:%h|%s|%ar|%an", "-n", "20"])
        .output()
        .map_err(|e| e.to_string())?;
        
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<String> = stdout.lines().map(|s| s.to_string()).collect();
        Ok(lines)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_remote_add(path: String, url: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["remote", "add", "origin", &url])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_push(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["push", "-u", "origin", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_pull(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["pull", "--rebase"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        // Abort the rebase if it failed
        let _ = Command::new("git")
            .current_dir(&path)
            .args(["rebase", "--abort"])
            .output();
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_has_remote(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["remote"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(!stdout.is_empty())
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn git_is_repo(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rev-parse", "--is-inside-work-tree"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output.status.success())
}

#[tauri::command]
fn git_remote_get_url(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["remote", "get-url", "origin"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn git_remote_set_url(path: String, url: String) -> Result<String, String> {
    // Check if remote "origin" exists
    let check = Command::new("git")
        .current_dir(&path)
        .args(["remote", "get-url", "origin"])
        .output()
        .map_err(|e| e.to_string())?;

    let args = if check.status.success() {
        vec!["remote", "set-url", "origin"]
    } else {
        vec!["remote", "add", "origin"]
    };

    let output = Command::new("git")
        .current_dir(&path)
        .args(&args)
        .arg(&url)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ── Git branch / task commands ──

#[tauri::command]
fn git_current_branch(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_checkout_new_branch(path: String, branch: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["checkout", "-b", &branch])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_checkout(path: String, branch: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["checkout", &branch])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_fetch(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["fetch", "origin"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_rebase(path: String, onto: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rebase", &onto])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        // Check if rebase resulted in conflicts (need manual resolution)
        if stderr.contains("CONFLICT") || stderr.contains("could not apply") {
            Err(format!("CONFLICT:{}", stderr))
        } else {
            // Abort for non-conflict failures
            let _ = Command::new("git")
                .current_dir(&path)
                .args(["rebase", "--abort"])
                .output();
            Err(stderr)
        }
    }
}

#[tauri::command]
fn git_rebase_continue(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rebase", "--continue"])
        .env("GIT_EDITOR", "true") // skip editor
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_rebase_abort(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rebase", "--abort"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_merge_branch(path: String, branch: String, message: Option<String>) -> Result<String, String> {
    let msg = message.unwrap_or_else(|| format!("Merge {}", branch));
    let output = Command::new("git")
        .current_dir(&path)
        .args(["merge", &branch, "--no-ff", "-m", &msg])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_delete_branch(path: String, branch: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["branch", "-d", &branch])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_conflict_files(path: String) -> Result<Vec<String>, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["diff", "--name-only", "--diff-filter=U"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let files: Vec<String> = stdout.lines().filter(|l| !l.is_empty()).map(|s| s.to_string()).collect();
        Ok(files)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn git_resolve_ours(path: String, file: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["checkout", "--ours", &file])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Command::new("git")
        .current_dir(&path)
        .args(["add", &file])
        .output()
        .map_err(|e| e.to_string())?;

    Ok("resolved".to_string())
}

#[tauri::command]
fn git_resolve_theirs(path: String, file: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["checkout", "--theirs", &file])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Command::new("git")
        .current_dir(&path)
        .args(["add", &file])
        .output()
        .map_err(|e| e.to_string())?;

    Ok("resolved".to_string())
}

#[tauri::command]
fn git_branch_exists(path: String, branch: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rev-parse", "--verify", &branch])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output.status.success())
}

// ── Export commands ──

/// Write raw bytes (base64-encoded) to a file on disk.
#[tauri::command]
fn export_write_bytes(path: String, data_base64: String) -> Result<(), String> {
    let bytes = BASE64.decode(&data_base64).map_err(|e| format!("Base64 decode error: {}", e))?;
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir error: {}", e))?;
    }
    fs::write(&path, bytes).map_err(|e| format!("Write error: {}", e))
}

/// Encode multiple RGBA frames into an animated GIF.
/// `frames_json` is a JSON array of { "rgba_base64": "...", "width": N, "height": N, "delay_ms": N }
#[tauri::command]
fn export_gif(path: String, frames_json: String) -> Result<(), String> {
    #[derive(Deserialize)]
    struct GifFrame {
        rgba_base64: String,
        width: u32,
        height: u32,
        delay_ms: u32,
    }

    let frames: Vec<GifFrame> =
        serde_json::from_str(&frames_json).map_err(|e| format!("JSON parse error: {}", e))?;

    if frames.is_empty() {
        return Err("No frames to encode".to_string());
    }

    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir error: {}", e))?;
    }

    let file = fs::File::create(&path).map_err(|e| format!("File create error: {}", e))?;
    let mut encoder = image::codecs::gif::GifEncoder::new(file);
    encoder
        .set_repeat(image::codecs::gif::Repeat::Infinite)
        .map_err(|e| format!("GIF repeat error: {}", e))?;

    for frame in &frames {
        let rgba_bytes = BASE64
            .decode(&frame.rgba_base64)
            .map_err(|e| format!("Frame base64 decode error: {}", e))?;

        let expected = (frame.width * frame.height * 4) as usize;
        if rgba_bytes.len() != expected {
            return Err(format!(
                "Frame RGBA size mismatch: got {} expected {}",
                rgba_bytes.len(),
                expected
            ));
        }

        let img_buf = image::RgbaImage::from_raw(frame.width, frame.height, rgba_bytes)
            .ok_or_else(|| "Failed to create image buffer".to_string())?;

        // GIF delay is in centiseconds (1/100th of a second)
        let delay_cs = (frame.delay_ms as f64 / 10.0).round().max(1.0) as u32;
        let gif_frame = image::Frame::from_parts(
            img_buf,
            0,
            0,
            image::Delay::from_saturating_duration(std::time::Duration::from_millis(
                (delay_cs * 10) as u64,
            )),
        );

        encoder
            .encode_frame(gif_frame)
            .map_err(|e| format!("GIF encode frame error: {}", e))?;
    }

    // Encoder writes on drop, but let's ensure it's flushed
    drop(encoder);

    // Verify file was written
    if !Path::new(&path).exists() {
        return Err("GIF file was not created".to_string());
    }

    let size = fs::metadata(&path)
        .map_err(|e| format!("Stat error: {}", e))?
        .len();

    if size < 10 {
        return Err("GIF file appears empty".to_string());
    }

    Ok(())
}

/// Run a Python plugin script. The script receives atlas metadata JSON on stdin
/// and writes the output format to stdout.
#[tauri::command]
fn export_run_python_plugin(
    script_path: String,
    input_json: String,
) -> Result<String, String> {
    let output = Command::new("python3")
        .arg(&script_path)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python: {}", e))
        .and_then(|mut child| {
            if let Some(ref mut stdin) = child.stdin {
                stdin
                    .write_all(input_json.as_bytes())
                    .map_err(|e| format!("Failed to write to Python stdin: {}", e))?;
            }
            // Close stdin so Python reads EOF
            drop(child.stdin.take());
            child
                .wait_with_output()
                .map_err(|e| format!("Failed to wait for Python: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python plugin error: {}", stderr));
    }

    String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 output: {}", e))
}

// ── Version history commands ──

/// Read a single file's content from a specific git commit.
fn git_show_file_at(repo_path: &str, commit: &str, file_path: &str) -> Result<Vec<u8>, String> {
    let spec = format!("{}:{}", commit, file_path);
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["show", &spec])
        .output()
        .map_err(|e| format!("git show error: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git show failed for {}: {}", spec, stderr));
    }

    Ok(output.stdout)
}

/// List files in a directory tree at a specific commit.
fn git_ls_tree(repo_path: &str, commit: &str, dir_path: &str) -> Result<Vec<String>, String> {
    let spec = format!("{}:{}", commit, dir_path);
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["ls-tree", "--name-only", &spec])
        .output()
        .map_err(|e| format!("git ls-tree error: {}", e))?;

    if !output.status.success() {
        // Directory might not exist at this commit
        return Ok(Vec::new());
    }

    Ok(String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| l.to_string())
        .collect())
}

/// Load the full project state from a specific git commit hash.
/// Returns the same JSON format as load_project_v2.
#[tauri::command]
fn git_load_project_at_commit(path: String, commit: String) -> Result<String, String> {
    let project_str = String::from_utf8(
        git_show_file_at(&path, &commit, "project.json")?
    ).map_err(|e| format!("Invalid UTF-8: {}", e))?;

    let raw: serde_json::Value =
        serde_json::from_str(&project_str).map_err(|e| format!("Invalid project.json: {}", e))?;

    // Old monolithic format
    if raw.get("spritesheets").is_some() {
        return Ok(project_str);
    }

    let meta: ProjectMeta =
        serde_json::from_value(raw).map_err(|e| format!("Invalid project.json: {}", e))?;

    // Load palettes
    let mut palettes: Vec<PaletteMeta> = Vec::new();
    let palette_names = git_ls_tree(&path, &commit, "palettes").unwrap_or_default();
    for name in &palette_names {
        if !name.ends_with(".json") { continue; }
        let content = String::from_utf8(
            git_show_file_at(&path, &commit, &format!("palettes/{}", name))?
        ).map_err(|e| format!("Invalid UTF-8: {}", e))?;
        let palette: PaletteMeta =
            serde_json::from_str(&content).map_err(|e| format!("Palette parse error: {}", e))?;
        palettes.push(palette);
    }

    // Load spritesheets
    let mut spritesheets: Vec<LoadedSpritesheet> = Vec::new();
    let sheet_names = git_ls_tree(&path, &commit, "spritesheets").unwrap_or_default();

    for sheet_name in &sheet_names {
        let sheet_base = format!("spritesheets/{}", sheet_name);
        let smeta_str = match git_show_file_at(&path, &commit, &format!("{}/spritesheet.json", sheet_base)) {
            Ok(bytes) => String::from_utf8(bytes).map_err(|e| format!("Invalid UTF-8: {}", e))?,
            Err(_) => continue,
        };
        let smeta: SpritesheetMetaJson =
            serde_json::from_str(&smeta_str).map_err(|e| format!("Spritesheet parse error: {}", e))?;

        // Load animations
        let mut animations: Vec<AnimationMeta> = Vec::new();
        let anim_names = git_ls_tree(&path, &commit, &format!("{}/animations", sheet_base)).unwrap_or_default();
        for aname in &anim_names {
            if !aname.ends_with(".json") { continue; }
            let acontent = String::from_utf8(
                git_show_file_at(&path, &commit, &format!("{}/animations/{}", sheet_base, aname))?
            ).map_err(|e| format!("Invalid UTF-8: {}", e))?;
            let anim: AnimationMeta =
                serde_json::from_str(&acontent).map_err(|e| format!("Animation parse error: {}", e))?;
            animations.push(anim);
        }

        // Load frames
        let mut frames: Vec<LoadedFrame> = Vec::new();
        let frame_names = git_ls_tree(&path, &commit, &format!("{}/frames", sheet_base)).unwrap_or_default();

        for fname in &frame_names {
            let frame_base = format!("{}/frames/{}", sheet_base, fname);
            let fmeta_str = match git_show_file_at(&path, &commit, &format!("{}/frame.json", frame_base)) {
                Ok(bytes) => String::from_utf8(bytes).map_err(|e| format!("Invalid UTF-8: {}", e))?,
                Err(_) => continue,
            };
            let fmeta: FrameMetaJson =
                serde_json::from_str(&fmeta_str).map_err(|e| format!("Frame parse error: {}", e))?;

            let mut layers: Vec<LoadedLayer> = Vec::new();
            for layer_id in &fmeta.layer_order {
                let lmeta_str = match git_show_file_at(&path, &commit, &format!("{}/layers/{}.json", frame_base, layer_id)) {
                    Ok(bytes) => String::from_utf8(bytes).map_err(|e| format!("Invalid UTF-8: {}", e))?,
                    Err(_) => continue,
                };
                let lmeta: LayerMetaJson =
                    serde_json::from_str(&lmeta_str).map_err(|e| format!("Layer parse error: {}", e))?;

                // Read PNG data and convert to data URL
                let data = match git_show_file_at(&path, &commit, &format!("{}/layers/{}.png", frame_base, layer_id)) {
                    Ok(png_bytes) => {
                        let b64 = BASE64.encode(&png_bytes);
                        format!("data:image/png;base64,{}", b64)
                    }
                    Err(_) => String::new(),
                };

                layers.push(LoadedLayer {
                    id: lmeta.id,
                    name: lmeta.name,
                    opacity: lmeta.opacity,
                    blend_mode: lmeta.blend_mode,
                    visible: lmeta.visible,
                    locked: lmeta.locked,
                    is_reference: lmeta.is_reference,
                    data,
                });
            }

            frames.push(LoadedFrame {
                id: fmeta.id,
                layers,
            });
        }

        spritesheets.push(LoadedSpritesheet {
            id: smeta.id,
            name: smeta.name,
            animations,
            frames,
        });
    }

    let loaded = LoadedProject {
        id: meta.id,
        name: meta.name,
        default_canvas_size: meta.default_canvas_size,
        palettes,
        spritesheets,
    };

    serde_json::to_string(&loaded).map_err(|e| e.to_string())
}

/// Restore all project files from a specific commit into the working directory.
/// This uses `git checkout <commit> -- .` to overwrite working tree files,
/// then stages everything as a new commit.
#[tauri::command]
fn git_restore_to_commit(path: String, commit: String, message: String) -> Result<String, String> {
    // Checkout all files from the target commit
    let output = Command::new("git")
        .current_dir(&path)
        .args(["checkout", &commit, "--", "."])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "Failed to restore files: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // Stage all changes
    Command::new("git")
        .current_dir(&path)
        .args(["add", "."])
        .output()
        .map_err(|e| e.to_string())?;

    // Commit the restored state
    let commit_output = Command::new("git")
        .current_dir(&path)
        .args(["commit", "-m", &message])
        .output()
        .map_err(|e| e.to_string())?;

    if commit_output.status.success() {
        Ok("Restored and committed".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&commit_output.stderr);
        if stderr.contains("nothing to commit") {
            Ok("No changes to restore (same as current state)".to_string())
        } else {
            Err(format!("Commit failed: {}", stderr))
        }
    }
}

// ── Wiki commands ──

#[tauri::command]
fn wiki_sync(cache_dir: String, url: String) -> Result<Vec<String>, String> {
    let wiki_path = Path::new(&cache_dir).join("wiki");

    if wiki_path.join(".git").exists() {
        // Pull latest
        let output = Command::new("git")
            .current_dir(&wiki_path)
            .args(["pull", "--ff-only"])
            .output()
            .map_err(|e| e.to_string())?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            // If pull fails, try reset to origin
            let _ = Command::new("git")
                .current_dir(&wiki_path)
                .args(["fetch", "origin"])
                .output();
            let _ = Command::new("git")
                .current_dir(&wiki_path)
                .args(["reset", "--hard", "origin/master"])
                .output();
            if !stderr.is_empty() {
                // Continue anyway — we have a local copy
            }
        }
    } else {
        // Clone
        fs::create_dir_all(&wiki_path).map_err(|e| e.to_string())?;
        let output = Command::new("git")
            .args(["clone", &url, wiki_path.to_str().unwrap()])
            .output()
            .map_err(|e| e.to_string())?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }

    // List .md files
    wiki_list_pages_inner(&wiki_path)
}

#[tauri::command]
fn wiki_list_pages(cache_dir: String) -> Result<Vec<String>, String> {
    let wiki_path = Path::new(&cache_dir).join("wiki");
    if !wiki_path.exists() {
        return Ok(vec![]);
    }
    wiki_list_pages_inner(&wiki_path)
}

fn wiki_list_pages_inner(wiki_path: &Path) -> Result<Vec<String>, String> {
    let mut pages: Vec<String> = Vec::new();
    let entries = fs::read_dir(wiki_path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.ends_with(".md") {
            pages.push(name.trim_end_matches(".md").to_string());
        }
    }
    pages.sort();
    // Put Home first if it exists
    if let Some(pos) = pages.iter().position(|p| p == "Home") {
        pages.remove(pos);
        pages.insert(0, "Home".to_string());
    }
    Ok(pages)
}

#[tauri::command]
fn wiki_read_page(cache_dir: String, page: String) -> Result<String, String> {
    let wiki_path = Path::new(&cache_dir).join("wiki");
    // Sanitize page name to prevent path traversal
    let safe_page = Path::new(&page)
        .file_name()
        .ok_or("Invalid page name")?
        .to_string_lossy()
        .to_string();
    let file_path = wiki_path.join(format!("{}.md", safe_page));
    fs::read_to_string(&file_path).map_err(|e| format!("Failed to read {}: {}", safe_page, e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_folder_exists,
            save_project,
            load_project,
            save_project_v2,
            load_project_v2,
            export_write_bytes,
            export_gif,
            export_run_python_plugin,
            git_load_project_at_commit,
            git_restore_to_commit,
            git_init,
            git_commit,
            git_status,
            git_log,
            git_remote_add,
            git_push,
            git_pull,
            git_has_remote,
            git_is_repo,
            git_remote_get_url,
            git_remote_set_url,
            git_current_branch,
            git_checkout_new_branch,
            git_checkout,
            git_fetch,
            git_rebase,
            git_rebase_continue,
            git_rebase_abort,
            git_merge_branch,
            git_delete_branch,
            git_conflict_files,
            git_resolve_ours,
            git_resolve_theirs,
            git_branch_exists,
            import_image,
            wiki_sync,
            wiki_list_pages,
            wiki_read_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
