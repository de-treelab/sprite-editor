use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use sprite_editor_lib::image_utils::{create_transparent_png, decode_data_url_to_png};

#[test]
fn transparent_png_has_valid_header() {
    let png = create_transparent_png(4, 4).unwrap();
    assert!(png.len() > 8);
    assert_eq!(&png[0..4], b"\x89PNG");
}

#[test]
fn transparent_png_dimensions() {
    let png = create_transparent_png(16, 8).unwrap();
    let img = image::load_from_memory(&png).unwrap();
    assert_eq!(img.width(), 16);
    assert_eq!(img.height(), 8);
    // All pixels should be transparent
    let rgba = img.to_rgba8();
    for pixel in rgba.pixels() {
        assert_eq!(pixel.0, [0, 0, 0, 0]);
    }
}

#[test]
fn decode_data_url_raw_rgba() {
    // 2x2 red pixels (RGBA)
    let red_pixel = [255u8, 0, 0, 255];
    let raw: Vec<u8> = red_pixel.repeat(4); // 2x2
    let b64 = BASE64.encode(&raw);
    let data_url = format!("data:application/octet-stream;base64,{}", b64);

    let png = decode_data_url_to_png(&data_url, 2, 2).unwrap();
    assert_eq!(&png[0..4], b"\x89PNG");

    let img = image::load_from_memory(&png).unwrap();
    assert_eq!(img.width(), 2);
    assert_eq!(img.height(), 2);
    let rgba = img.to_rgba8();
    for pixel in rgba.pixels() {
        assert_eq!(pixel.0, [255, 0, 0, 255]);
    }
}

#[test]
fn decode_data_url_already_png() {
    let original_png = create_transparent_png(2, 2).unwrap();
    let b64 = BASE64.encode(&original_png);
    let data_url = format!("data:image/png;base64,{}", b64);

    let result = decode_data_url_to_png(&data_url, 2, 2).unwrap();
    // Should return the PNG bytes unchanged
    assert_eq!(result, original_png);
}

#[test]
fn decode_empty_data_returns_transparent_png() {
    let data_url = "data:image/png;base64,";
    let png = decode_data_url_to_png(data_url, 4, 4).unwrap();
    assert_eq!(&png[0..4], b"\x89PNG");

    let img = image::load_from_memory(&png).unwrap();
    assert_eq!(img.width(), 4);
    assert_eq!(img.height(), 4);
}

#[test]
fn decode_raw_base64_without_data_url_prefix() {
    let raw: Vec<u8> = vec![0, 255, 0, 255]; // 1x1 green pixel
    let b64 = BASE64.encode(&raw);
    // No "data:..." prefix, just raw base64
    let png = decode_data_url_to_png(&b64, 1, 1).unwrap();
    assert_eq!(&png[0..4], b"\x89PNG");
}

#[test]
fn decode_mismatched_size_errors() {
    // 4 bytes of raw data but claim 2x2 (needs 16 bytes)
    let raw = vec![0u8; 4];
    let b64 = BASE64.encode(&raw);
    let data_url = format!("data:application/octet-stream;base64,{}", b64);
    let result = decode_data_url_to_png(&data_url, 2, 2);
    assert!(result.is_err());
}
