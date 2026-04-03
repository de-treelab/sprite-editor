use std::fs;
use std::path::Path;

use crate::image_utils::{decode_data_url_to_png, png_file_to_data_url};
use crate::types::*;

// ── Existing commands (kept for backward compatibility) ──

#[tauri::command]
pub fn check_folder_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub fn save_project(path: String, project_json: String) -> Result<(), String> {
    let file_path = Path::new(&path).join("project.json");
    if !Path::new(&path).exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    fs::write(file_path, project_json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_project(path: String) -> Result<String, String> {
    let file_path = Path::new(&path).join("project.json");
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// ── V2 save: multi-file format ──

#[tauri::command]
pub fn save_project_v2(path: String, manifest_json: String) -> Result<(), String> {
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

        // Write images
        let images_dir = sheet_dir.join("images");
        if !sheet.images.is_empty() {
            fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
        }
        for img in &sheet.images {
            let ij = serde_json::to_string_pretty(img).map_err(|e| e.to_string())?;
            fs::write(images_dir.join(format!("{}.json", img.id)), ij)
                .map_err(|e| e.to_string())?;
        }

        // Delete removed images
        for iid in &sheet.deleted_images {
            let ipath = images_dir.join(format!("{}.json", iid));
            if ipath.exists() {
                fs::remove_file(ipath).map_err(|e| e.to_string())?;
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
                layer_order: frame.layer_order.clone(),
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
pub fn load_project_v2(path: String) -> Result<String, String> {
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

            // Load images
            let mut images: Vec<ReferenceImageMeta> = Vec::new();
            let images_dir = sheet_dir.join("images");
            if images_dir.exists() {
                for ientry in fs::read_dir(&images_dir).map_err(|e| e.to_string())? {
                    let ientry = ientry.map_err(|e| e.to_string())?;
                    let ipath = ientry.path();
                    if ipath.extension().and_then(|e| e.to_str()) == Some("json") {
                        let icontent = fs::read_to_string(&ipath).map_err(|e| e.to_string())?;
                        let img: ReferenceImageMeta =
                            serde_json::from_str(&icontent).map_err(|e| e.to_string())?;
                        images.push(img);
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
                images,
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
