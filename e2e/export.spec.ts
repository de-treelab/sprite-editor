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

test("export modal opens from menu", async ({ page }) => {
  await page.getByRole("button", { name: "File" }).click();
  const exportItem = page.getByText("Export...").first();
  await exportItem.click();

  // Export modal should appear
  await expect(page.getByText("Format", { exact: true })).toBeVisible({
    timeout: 5_000,
  });
});

test("export modal has format selection", async ({ page }) => {
  await page.getByRole("button", { name: "File" }).click();
  await page.getByText("Export...").first().click();

  await expect(page.getByText("Format", { exact: true })).toBeVisible();
});

test("export modal cancel closes it", async ({ page }) => {
  await page.getByRole("button", { name: "File" }).click();
  await page.getByText("Export...").first().click();
  await expect(page.getByText("Format", { exact: true })).toBeVisible();

  // Click cancel (ghost variant button)
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Metadata Format")).not.toBeVisible();
});
