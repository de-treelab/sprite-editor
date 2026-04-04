import { Page } from "@playwright/test";

/**
 * Open a top-level menu by label text (e.g. "File", "Edit", "View", "Task").
 */
export async function openMenu(page: Page, menuLabel: string): Promise<void> {
  await page.getByRole("button", { name: menuLabel, exact: true }).click();
}

/**
 * Click a menu item by its label text.
 * Opens the parent menu first if `parentMenu` is provided.
 */
export async function clickMenuItem(
  page: Page,
  itemLabel: string,
  parentMenu?: string,
): Promise<void> {
  if (parentMenu) {
    await openMenu(page, parentMenu);
  }
  await page.getByText(itemLabel).first().click();
}
