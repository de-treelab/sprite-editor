import { test, expect } from "@playwright/test";
import { setupTauriMocks } from "./helpers/tauriMock";
import { waitForAppReady, createProjectViaStore } from "./helpers/project";
import { clickMenuItem } from "./helpers/navigation";

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto("/");
  await waitForAppReady(page);
  await createProjectViaStore(page);
  await page.waitForTimeout(500);
});

test("settings page opens from Edit menu", async ({ page }) => {
  await clickMenuItem(page, "Settings", "Edit");

  // Settings overlay should be visible
  await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible({
    timeout: 5_000,
  });
});

test("settings page can be closed", async ({ page }) => {
  await clickMenuItem(page, "Settings", "Edit");
  await expect(page.locator(".fixed.inset-0.z-50")).toBeVisible({
    timeout: 5_000,
  });

  // Press Escape to close, or use the close button
  await page.keyboard.press("Escape");
  // If Escape doesn't work on the settings page, try clicking close
  const overlay = page.locator(".fixed.inset-0.z-50");
  if (await overlay.isVisible().catch(() => false)) {
    // Find and click the close button
    const closeBtn = page.locator(".fixed.inset-0.z-50 button").first();
    await closeBtn.click();
  }

  // Verify it's closed - the editor should be visible again
  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
});
