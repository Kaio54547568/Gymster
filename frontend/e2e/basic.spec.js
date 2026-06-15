import { test, expect } from "@playwright/test";

test("has title containing Gymster", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Gymster/);
});

test("renders main layout container", async ({ page }) => {
  await page.goto("/");
  const root = page.locator("#root");
  await expect(root).toBeVisible();
});
