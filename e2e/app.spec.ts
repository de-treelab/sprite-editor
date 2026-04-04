import { test, expect } from "@playwright/test";
import { setupTauriMocks } from "./helpers/tauriMock";
import { waitForAppReady } from "./helpers/project";

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
});

test("app loads and shows landing page", async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);

  // Landing page should show create and load buttons
  await expect(page.getByText("Create New Project")).toBeVisible();
  await expect(page.getByText("Load Project")).toBeVisible();
});

test("top bar menus are visible", async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);

  await expect(page.getByRole("button", { name: "File" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View" })).toBeVisible();
});
