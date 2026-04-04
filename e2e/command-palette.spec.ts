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

test("command palette opens with keyboard shortcut", async ({ page }) => {
  await page.keyboard.press("Control+Shift+p");
  // The command palette should show a search input
  const input = page.getByPlaceholder("Type a command");
  await expect(input).toBeVisible({ timeout: 5_000 });
});

test("command palette closes on Escape", async ({ page }) => {
  await page.keyboard.press("Control+Shift+p");
  const input = page.getByPlaceholder("Type a command");
  await expect(input).toBeVisible({ timeout: 5_000 });

  await page.keyboard.press("Escape");
  // Command palette should be closed
  await expect(input).not.toBeVisible({ timeout: 3_000 });
});

test("command palette shows commands", async ({ page }) => {
  await page.keyboard.press("Control+Shift+p");
  await expect(page.getByPlaceholder("Type a command")).toBeVisible({
    timeout: 5_000,
  });
  // Wait for command list to populate - look for any command item
  const items = page.locator("button[data-cmd-index]");
  await expect(items.first()).toBeVisible({ timeout: 5_000 });
  // There should be at least a few registered commands
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});
