import { invoke } from '@tauri-apps/api/core';

export async function checkFolderExists(path: string): Promise<boolean> {
  return await invoke('check_folder_exists', { path });
}

export async function saveProject(path: string, projectJson: string): Promise<void> {
  await invoke('save_project', { path, projectJson });
}

export async function loadProject(path: string): Promise<string> {
  return await invoke('load_project', { path });
}

export async function saveProjectV2(path: string, manifestJson: string): Promise<void> {
  await invoke('save_project_v2', { path, manifestJson });
}

export async function loadProjectV2(path: string): Promise<string> {
  return await invoke('load_project_v2', { path });
}

export async function gitInit(path: string): Promise<string> {
  return await invoke('git_init', { path });
}

export async function gitCommit(path: string, message: string): Promise<string> {
  return await invoke('git_commit', { path, message });
}

export async function gitStatus(path: string): Promise<string> {
  return await invoke('git_status', { path });
}

export async function gitLog(path: string): Promise<string[]> {
  return await invoke('git_log', { path });
}

export async function gitRemoteAdd(path: string, url: string): Promise<string> {
  return await invoke('git_remote_add', { path, url });
}

export async function gitPush(path: string): Promise<string> {
  return await invoke('git_push', { path });
}

export async function gitPull(path: string): Promise<string> {
  return await invoke('git_pull', { path });
}

export async function gitHasRemote(path: string): Promise<boolean> {
  return await invoke('git_has_remote', { path });
}

export async function gitIsRepo(path: string): Promise<boolean> {
  return await invoke('git_is_repo', { path });
}

export async function gitRemoteGetUrl(path: string): Promise<string> {
  return await invoke('git_remote_get_url', { path });
}

export async function gitRemoteSetUrl(path: string, url: string): Promise<string> {
  return await invoke('git_remote_set_url', { path, url });
}

export async function gitCurrentBranch(path: string): Promise<string> {
  return await invoke('git_current_branch', { path });
}

export async function gitCheckoutNewBranch(path: string, branch: string): Promise<string> {
  return await invoke('git_checkout_new_branch', { path, branch });
}

export async function gitCheckout(path: string, branch: string): Promise<string> {
  return await invoke('git_checkout', { path, branch });
}

export async function gitFetch(path: string): Promise<string> {
  return await invoke('git_fetch', { path });
}

export async function gitRebase(path: string, onto: string): Promise<string> {
  return await invoke('git_rebase', { path, onto });
}

export async function gitRebaseContinue(path: string): Promise<string> {
  return await invoke('git_rebase_continue', { path });
}

export async function gitRebaseAbort(path: string): Promise<string> {
  return await invoke('git_rebase_abort', { path });
}

export async function gitMergeBranch(path: string, branch: string, message?: string): Promise<string> {
  return await invoke('git_merge_branch', { path, branch, message });
}

export async function gitDeleteBranch(path: string, branch: string): Promise<string> {
  return await invoke('git_delete_branch', { path, branch });
}

export async function gitConflictFiles(path: string): Promise<string[]> {
  return await invoke('git_conflict_files', { path });
}

export async function gitResolveOurs(path: string, file: string): Promise<string> {
  return await invoke('git_resolve_ours', { path, file });
}

export async function gitResolveTheirs(path: string, file: string): Promise<string> {
  return await invoke('git_resolve_theirs', { path, file });
}

export async function gitBranchExists(path: string, branch: string): Promise<boolean> {
  return await invoke('git_branch_exists', { path, branch });
}

// ── Image import ──

export interface ImportedImage {
  data_url: string;
  width: number;
  height: number;
}

export async function importImage(path: string): Promise<ImportedImage> {
  return await invoke('import_image', { path });
}

// ── Export commands ──

export async function exportWriteBytes(path: string, dataBase64: string): Promise<void> {
  await invoke('export_write_bytes', { path, dataBase64 });
}

export async function exportGif(path: string, framesJson: string): Promise<void> {
  await invoke('export_gif', { path, framesJson });
}

export async function exportRunPythonPlugin(scriptPath: string, inputJson: string): Promise<string> {
  return await invoke('export_run_python_plugin', { scriptPath, inputJson });
}

// ── Version history commands ──

export async function gitLoadProjectAtCommit(path: string, commit: string): Promise<string> {
  return await invoke('git_load_project_at_commit', { path, commit });
}

export async function gitRestoreToCommit(path: string, commit: string, message: string): Promise<string> {
  return await invoke('git_restore_to_commit', { path, commit, message });
}
