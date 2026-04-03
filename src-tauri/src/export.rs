use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::Command;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use serde::Deserialize;

#[tauri::command]
pub fn export_write_bytes(path: String, data_base64: String) -> Result<(), String> {
    let bytes = BASE64.decode(&data_base64).map_err(|e| format!("Base64 decode error: {}", e))?;
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir error: {}", e))?;
    }
    fs::write(&path, bytes).map_err(|e| format!("Write error: {}", e))
}

#[tauri::command]
pub fn export_gif(path: String, frames_json: String) -> Result<(), String> {
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

#[tauri::command]
pub fn export_run_python_plugin(
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
