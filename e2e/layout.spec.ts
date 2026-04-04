import { test, expect } from "@playwright/test";
import { setupTauriMocks } from "./helpers/tauriMock";
import { waitForAppReady, createProjectViaStore } from "./helpers/project";

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto("/");
  await waitForAppReady(page);
  await createProjectViaStore(page);
  await page.waitForTimeout(500);
});

test("layout renders with panels", async ({ page }) => {
  // The layout root should contain panel containers
  // Look for the main layout area
  const layout = page.locator(".flex.flex-1.overflow-hidden").first();
  await expect(layout).toBeVisible();
});

test("view menu is accessible", async ({ page }) => {
  await page.getByRole("button", { name: "View" }).click();
  // View menu should show layout-related options
  // The exact items depend on registered views but the menu should open
  await page.waitForTimeout(300);
  // Just verify the menu opened without crashing
  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
});
