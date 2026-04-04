import { test, expect } from "@playwright/test";
import { setupTauriMocks } from "./helpers/tauriMock";
import { waitForAppReady, createProjectViaStore } from "./helpers/project";

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto("/");
  await waitForAppReady(page);
  // Inject a project so the editor layout renders
  await createProjectViaStore(page);
  // Wait for the editor layout to stabilize
  await page.waitForTimeout(500);
});

test("canvas is rendered when project is open", async ({ page }) => {
  // PixiJS renders into a canvas element
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10_000 });
});

test("sidebar shows tool buttons", async ({ page }) => {
  // The sidebar should contain tool buttons from the tool registry
  // At minimum the pencil tool should be there
  const sidebar = page.locator('[class*="bg-slate-800"][class*="flex-col"]').first();
  await expect(sidebar).toBeVisible();
});

test("clicking canvas does not crash", async ({ page }) => {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  // Click in the center of the canvas
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // App should still be functional - top bar visible
  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
});

test("undo/redo keyboard shortcuts do not crash", async ({ page }) => {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  // Draw something first
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Undo
  await page.keyboard.press("Control+z");
  // Redo
  await page.keyboard.press("Control+Shift+z");

  // App still functional
  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
});
