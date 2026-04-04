import { Page } from "@playwright/test";

/**
 * Inject a mock for window.__TAURI_INTERNALS__ so that the app can run
 * in a plain browser without the Tauri runtime.
 *
 * Call this via `page.addInitScript` BEFORE navigating to the app.
 */
export function tauriMockScript(): string {
  return `
    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd, args) => {
        // Default mock responses per Tauri command
        const handlers = {
          'check_folder_exists': () => false,
          'save_project': () => {},
          'load_project': () => '{}',
          'save_project_v2': () => {},
          'load_project_v2': () => '{}',
          'git_init': () => {},
          'git_commit': () => {},
          'git_status': () => '',
          'git_log': () => '',
          'git_remote_add': () => {},
          'git_push': () => {},
          'git_pull': () => {},
          'git_has_remote': () => false,
          'git_is_repo': () => false,
          'git_remote_get_url': () => '',
          'git_remote_set_url': () => {},
          'git_current_branch': () => 'main',
          'git_checkout_new_branch': () => {},
          'git_checkout': () => {},
          'git_fetch': () => {},
          'git_rebase': () => {},
          'git_rebase_continue': () => {},
          'git_rebase_abort': () => {},
          'git_merge_branch': () => {},
          'git_delete_branch': () => {},
          'git_conflict_files': () => '[]',
          'git_resolve_ours': () => {},
          'git_resolve_theirs': () => {},
          'git_branch_exists': () => false,
          'export_atlas': () => {},
          'export_gif': () => {},
          'plugin:dialog|open': () => null,
          'plugin:dialog|save': () => null,
          'plugin:dialog|message': () => {},
          'plugin:dialog|ask': () => false,
          'plugin:dialog|confirm': () => false,
          'plugin:path|resolve_directory': (a) => a?.path || '/tmp',
          'plugin:path|join': (a) => (a?.paths || []).join('/'),
        };

        const handler = handlers[cmd];
        if (handler) return handler(args);
        console.warn('[tauri-mock] Unhandled command:', cmd, args);
        return null;
      },
      transformCallback: (callback, once) => {
        const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        window['_' + id] = (result) => {
          if (once) delete window['_' + id];
          return callback?.(result);
        };
        return id;
      },
      unregisterCallback: (id) => {
        delete window['_' + id];
      },
    };
  `;
}

/**
 * Set up page with Tauri mocks before navigating.
 */
export async function setupTauriMocks(page: Page): Promise<void> {
  await page.addInitScript({ content: tauriMockScript() });
}
