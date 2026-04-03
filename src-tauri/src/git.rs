use std::process::Command;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;

use crate::types::*;

// ── Basic git commands ──

#[tauri::command]
pub fn git_init(path: String) -> Result<String, String> {
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
pub fn git_commit(path: String, message: String) -> Result<String, String> {
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
pub fn git_status(path: String) -> Result<String, String> {
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
pub fn git_log(path: String) -> Result<Vec<String>, String> {
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
pub fn git_remote_add(path: String, url: String) -> Result<String, String> {
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
pub fn git_push(path: String) -> Result<String, String> {
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
pub fn git_pull(path: String) -> Result<String, String> {
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
pub fn git_has_remote(path: String) -> Result<bool, String> {
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
pub fn git_is_repo(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rev-parse", "--is-inside-work-tree"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output.status.success())
}

#[tauri::command]
pub fn git_remote_get_url(path: String) -> Result<String, String> {
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
pub fn git_remote_set_url(path: String, url: String) -> Result<String, String> {
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
pub fn git_current_branch(path: String) -> Result<String, String> {
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
pub fn git_checkout_new_branch(path: String, branch: String) -> Result<String, String> {
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
pub fn git_checkout(path: String, branch: String) -> Result<String, String> {
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
pub fn git_fetch(path: String) -> Result<String, String> {
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
pub fn git_rebase(path: String, onto: String) -> Result<String, String> {
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
pub fn git_rebase_continue(path: String) -> Result<String, String> {
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
pub fn git_rebase_abort(path: String) -> Result<String, String> {
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
pub fn git_merge_branch(path: String, branch: String, message: Option<String>) -> Result<String, String> {
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
pub fn git_delete_branch(path: String, branch: String) -> Result<String, String> {
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
pub fn git_conflict_files(path: String) -> Result<Vec<String>, String> {
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
pub fn git_resolve_ours(path: String, file: String) -> Result<String, String> {
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
pub fn git_resolve_theirs(path: String, file: String) -> Result<String, String> {
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
pub fn git_branch_exists(path: String, branch: String) -> Result<bool, String> {
    let output = Command::new("git")
        .current_dir(&path)
        .args(["rev-parse", "--verify", &branch])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output.status.success())
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

#[tauri::command]
pub fn git_load_project_at_commit(path: String, commit: String) -> Result<String, String> {
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
            images: Vec::new(),
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

#[tauri::command]
pub fn git_restore_to_commit(path: String, commit: String, message: String) -> Result<String, String> {
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
