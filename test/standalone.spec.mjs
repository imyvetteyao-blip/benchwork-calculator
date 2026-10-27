import { test, expect } from "@playwright/test";

test("standalone release loads real Demo data and all routes without external runtime requests", async ({ page, baseURL }) => {
  const external = [];
  const errors = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Prepare with confidence." })).toBeVisible();
  await page.getByRole("link", { name: "Buffer Making", exact: true }).click();
  await expect(page.locator("#inventory-query")).toBeVisible();
  await expect(page.locator("#main")).toContainText("Published Demo inventory");
  await page.locator("#inventory-query").fill("Sodium chloride");
  await expect(page.getByRole("button", { name: "Add Component", exact: true })).toHaveCount(1);
  await expect(page.locator("#main")).toContainText("DEMO-001");
  await page.getByRole("link", { name: "Cocktail Making", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cocktail Making", exact: true })).toBeVisible();
  await page.goto("#sis");
  await expect(page.getByRole("heading", { name: "Cocktail Making", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Records", exact: true }).click();
  await expect(page.locator("#main")).toContainText("No saved records");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
