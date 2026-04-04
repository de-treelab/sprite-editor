import { test, expect } from "@playwright/test";
import { setupTauriMocks } from "./helpers/tauriMock";
import { waitForAppReady, openNewProjectModal } from "./helpers/project";

test.beforeEach(async ({ page }) => {
  await setupTauriMocks(page);
  await page.goto("/");
  await waitForAppReady(page);
});

test("open new project modal from landing page", async ({ page }) => {
  await page.getByText("Create New Project").click();
  await expect(page.getByText("Project Name")).toBeVisible();
});

test("open new project modal from File menu", async ({ page }) => {
  await page.getByRole("button", { name: "File" }).click();
  // Look for the "New Project" menu item
  const newItem = page.getByText("New Project").first();
  await newItem.click();
  await expect(page.getByText("Project Name")).toBeVisible();
});

test("new project modal has required fields", async ({ page }) => {
  await openNewProjectModal(page);

  // Should have name, width, height fields and action buttons
  await expect(page.getByText("Project Name")).toBeVisible();
  await expect(page.getByText("Width (px)")).toBeVisible();
  await expect(page.getByText("Height (px)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create", exact: true }),
  ).toBeVisible();
});

test("cancel closes new project modal", async ({ page }) => {
  await openNewProjectModal(page);
  await page.getByRole("button", { name: "Cancel" }).click();

  // Modal should be gone
  await expect(page.getByText("Project Name")).not.toBeVisible();
});
