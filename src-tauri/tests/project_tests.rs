use std::fs;

use sprite_editor_lib::project::{check_folder_exists, load_project, save_project};

#[test]
fn check_folder_exists_returns_false_for_missing() {
    let result = check_folder_exists("/tmp/sprite_editor_test_nonexistent_42".to_string()).unwrap();
    assert!(!result);
}

#[test]
fn check_folder_exists_returns_true_for_existing() {
    let dir = tempfile::tempdir().unwrap();
    let result = check_folder_exists(dir.path().to_string_lossy().to_string()).unwrap();
    assert!(result);
}

#[test]
fn save_and_load_project_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().to_string_lossy().to_string();
    let json = r#"{"id":"test-1","name":"Test Project","spritesheets":[]}"#.to_string();

    save_project(path.clone(), json.clone()).unwrap();
    let loaded = load_project(path).unwrap();
    assert_eq!(loaded, json);
}

#[test]
fn save_project_creates_directory() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("subdir").to_string_lossy().to_string();

    save_project(
        path.clone(),
        r#"{"id":"1"}"#.to_string(),
    )
    .unwrap();

    assert!(fs::metadata(format!("{}/project.json", path)).is_ok());
}

#[test]
fn load_project_errors_on_missing() {
    let result = load_project("/tmp/sprite_editor_test_nonexistent_42".to_string());
    assert!(result.is_err());
}
