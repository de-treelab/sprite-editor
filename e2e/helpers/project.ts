import { Page, expect } from "@playwright/test";

/**
 * Wait for the app to fully load (no-project landing page or editor layout).
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // The app always renders the TopBar with menu buttons
  await expect(page.getByRole("button", { name: "File" })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Open the New Project modal from the landing page or via the menu.
 */
export async function openNewProjectModal(page: Page): Promise<void> {
  // Try the landing page button first
  const landingBtn = page.getByText("Create New Project");
  if (await landingBtn.isVisible().catch(() => false)) {
    await landingBtn.click();
  } else {
    await page.getByRole("button", { name: "File" }).click();
    await page.getByText("New").first().click();
  }
  // Wait for modal to appear
  await expect(page.getByText("Project Name")).toBeVisible();
}

/**
 * Create a new project through the UI.
 * Fills in the project name but skips location selection (requires native dialog).
 */
export async function createProjectViaStore(page: Page, name = "Test Project"): Promise<void> {
  await page.evaluate((projName) => {
    // Directly set a project in the store to skip Tauri file system interactions
    const projectStore = (window as any).__zustand_projectStore;
    if (projectStore) {
      projectStore.getState().setProject({
        id: "test-project-1",
        name: projName,
        defaultCanvasSize: { width: 64, height: 64 },
        palettes: [{ id: "pal-1", name: "Default", colors: ["#000000", "#ffffff"] }],
        spritesheets: [
          {
            id: "sheet-1",
            name: "Main",
            animations: [
              {
                id: "anim-1",
                name: "Idle",
                keyframes: [{ id: "kf-1", time: 0, frameId: "frame-1" }],
              },
            ],
            images: [],
            frames: [
              {
                id: "frame-1",
                layers: [
                  {
                    id: "layer-1",
                    name: "Layer 1",
                    opacity: 1,
                    blendMode: "normal",
                    visible: true,
                    locked: false,
                    isReference: false,
                    data: "",
                  },
                ],
              },
            ],
          },
        ],
      });

      // Set active items so the editor is fully functional
      projectStore.getState().setActiveSpritesheet("sheet-1");
      projectStore.getState().setActiveItem("anim-1", "animation");
    }
  }, name);
}
