pub mod export;
pub mod git;
pub mod image_utils;
pub mod project;
pub mod types;
pub mod wiki;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            project::check_folder_exists,
            project::save_project,
            project::load_project,
            project::save_project_v2,
            project::load_project_v2,
            export::export_write_bytes,
            export::export_gif,
            export::export_run_python_plugin,
            git::git_load_project_at_commit,
            git::git_restore_to_commit,
            git::git_init,
            git::git_commit,
            git::git_status,
            git::git_log,
            git::git_remote_add,
            git::git_push,
            git::git_pull,
            git::git_has_remote,
            git::git_is_repo,
            git::git_remote_get_url,
            git::git_remote_set_url,
            git::git_current_branch,
            git::git_checkout_new_branch,
            git::git_checkout,
            git::git_fetch,
            git::git_rebase,
            git::git_rebase_continue,
            git::git_rebase_abort,
            git::git_merge_branch,
            git::git_delete_branch,
            git::git_conflict_files,
            git::git_resolve_ours,
            git::git_resolve_theirs,
            git::git_branch_exists,
            image_utils::import_image,
            wiki::wiki_sync,
            wiki::wiki_list_pages,
            wiki::wiki_read_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
