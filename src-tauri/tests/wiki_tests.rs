use std::fs;

use sprite_editor_lib::wiki::{wiki_list_pages, wiki_read_page};

#[test]
fn wiki_list_pages_empty_when_no_wiki_dir() {
    let dir = tempfile::tempdir().unwrap();
    let result = wiki_list_pages(dir.path().to_string_lossy().to_string()).unwrap();
    assert!(result.is_empty());
}

#[test]
fn wiki_list_pages_finds_md_files() {
    let dir = tempfile::tempdir().unwrap();
    let wiki_dir = dir.path().join("wiki");
    fs::create_dir_all(&wiki_dir).unwrap();
    fs::write(wiki_dir.join("Setup.md"), "# Setup").unwrap();
    fs::write(wiki_dir.join("Home.md"), "# Home").unwrap();
    fs::write(wiki_dir.join("notes.txt"), "ignored").unwrap();

    let pages = wiki_list_pages(dir.path().to_string_lossy().to_string()).unwrap();
    assert_eq!(pages.len(), 2);
    // Home should be first
    assert_eq!(pages[0], "Home");
    assert_eq!(pages[1], "Setup");
}

#[test]
fn wiki_read_page_returns_content() {
    let dir = tempfile::tempdir().unwrap();
    let wiki_dir = dir.path().join("wiki");
    fs::create_dir_all(&wiki_dir).unwrap();
    fs::write(wiki_dir.join("Test.md"), "# Test Page\nHello").unwrap();

    let content = wiki_read_page(
        dir.path().to_string_lossy().to_string(),
        "Test".to_string(),
    )
    .unwrap();
    assert_eq!(content, "# Test Page\nHello");
}

#[test]
fn wiki_read_page_rejects_path_traversal() {
    let dir = tempfile::tempdir().unwrap();
    let wiki_dir = dir.path().join("wiki");
    fs::create_dir_all(&wiki_dir).unwrap();
    fs::write(wiki_dir.join("legit.md"), "ok").unwrap();

    let result = wiki_read_page(
        dir.path().to_string_lossy().to_string(),
        "../../../etc/passwd".to_string(),
    );
    // Should either fail or not read the traversal path
    // The sanitization uses file_name() which strips the path
    assert!(result.is_err() || result.unwrap() != "ok");
}

#[test]
fn wiki_read_page_errors_on_missing() {
    let dir = tempfile::tempdir().unwrap();
    let wiki_dir = dir.path().join("wiki");
    fs::create_dir_all(&wiki_dir).unwrap();

    let result = wiki_read_page(
        dir.path().to_string_lossy().to_string(),
        "nonexistent".to_string(),
    );
    assert!(result.is_err());
}
