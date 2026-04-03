use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn wiki_sync(cache_dir: String, url: String) -> Result<Vec<String>, String> {
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
pub fn wiki_list_pages(cache_dir: String) -> Result<Vec<String>, String> {
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
pub fn wiki_read_page(cache_dir: String, page: String) -> Result<String, String> {
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
