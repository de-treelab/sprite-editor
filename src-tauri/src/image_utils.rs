use std::fs;
use std::path::Path;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use image::ImageEncoder;
use serde::Serialize;

pub fn decode_data_url_to_png(data: &str, width: u32, height: u32) -> Result<Vec<u8>, String> {
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

pub fn create_transparent_png(width: u32, height: u32) -> Result<Vec<u8>, String> {
    let pixel_data = vec![0u8; (width * height * 4) as usize];
    let mut png_bytes = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(&pixel_data, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("PNG encode error: {}", e))?;
    Ok(png_bytes)
}

pub fn png_file_to_data_url(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
    let b64 = BASE64.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", b64))
}

#[derive(Serialize)]
pub struct ImportedImage {
    pub data_url: String,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn import_image(path: String) -> Result<ImportedImage, String> {
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
