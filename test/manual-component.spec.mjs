import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { field, detailField, mockInventory, publishedInventory, addComponent } from "./fixture.mjs";

const openManual = async (page) => {
  await page.getByRole("button", { name: "Add Manual Component", exact: true }).click();
  return page.getByRole("dialog", { name: "Add Manual Component", exact: true });
};

test("manual components work without inventory and survive review, save, reopening and Excel export", async ({ page }) => {
  await mockInventory(page, { current: publishedInventory(), fail: true });
  await page.goto("#buffer");
  await expect(page.getByText(/Unable to load built-in inventory/)).toBeVisible();
  const dialog = await openManual(page);
  await dialog.getByLabel("Chemical Name", { exact: true }).fill(" ");
  await dialog.getByRole("button", { name: "Add Component", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Chemical Name is required.");
  await expect(page.locator(".component-row")).toHaveCount(0);
  await dialog.getByLabel("Chemical Name", { exact: true }).fill("Unlisted compound");
  await dialog.getByLabel("Molecular Weight (g/mol)", { exact: true }).fill("100");
  await dialog.getByLabel("Physical Form", { exact: true }).selectOption("solid");
  await dialog.getByText("Supplier and identifiers (optional)", { exact: true }).click();
  await dialog.getByLabel("Brand (optional)", { exact: true }).fill("VMR");
  await dialog.getByLabel("CAS (optional)", { exact: true }).fill("Z0014");
  await dialog.getByLabel("Barcode (optional)", { exact: true }).fill("GCR000888");
  await dialog.getByLabel("Lot (optional)", { exact: true }).fill("AD32345");
  await dialog.getByRole("button", { name: "Add Component", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.locator(".component-row");
  await expect(row).toContainText("Manual entry");
  await field(page, "name").fill("Manual preparation");
  await field(page, "volume").fill("1000");
  await field(page, "components.0.target").fill("10");
  await field(page, "components.0.actualMass").fill("1010");
  await expect(row.locator(".target-mass-cell")).toHaveText("1000.00");
  await expect(row.locator("td").nth(7)).toContainText("+1.00");
  await row.getByRole("button", { name: "Details", exact: true }).click();
  await detailField(page, "components.0.reviewed").check();
  await page.getByRole("button", { name: "Mark Reviewed", exact: true }).click();
  await page.getByRole("button", { name: "Save Preparation Record", exact: true }).first().click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("lab-preparation-workbench.records.v1"))[0]);
  expect(saved.status).toBe("Reviewed");
  expect(saved.demo).toBe(false);
  expect(saved.inputs.components[0].entrySource).toBe("manual");
  expect(saved.inputs.components[0].inventoryVersion).toBeNull();
  await page.reload();
  await page.getByRole("link", { name: "Records", exact: true }).click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(row).toContainText("Unlisted compound");
  await expect(row.locator("td").nth(7)).toContainText("+1.00");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Preparation Excel", exact: true }).click();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await (await download).path());
  const sheet = workbook.getWorksheet("Preparation");
  expect(sheet.getCell("A15").value).toBe("Unlisted compound");
  expect(sheet.getCell("B15").value).toBe("VMR, CAS Z0014, Lot AD32345, Barcode GCR000888");
  expect(sheet.getCell("F15").value).toBe(1000);
  expect(sheet.getCell("I15").value).toBe(1);
  expect(sheet.getCell("A15").note).toContain("Manual entry");
  expect(sheet.getCell("A15").note).toContain("CAS: Z0014");
  await row.getByRole("button", { name: "Details", exact: true }).click();
  await field(page, "components.0.mw").fill("200");
  await page.getByRole("button", { name: "Edit Manual Component", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit Manual Component", exact: true });
  await expect(edit.getByLabel("Molecular Weight (g/mol)", { exact: true })).toHaveValue("200");
  await edit.getByLabel("Chemical Name", { exact: true }).fill("Renamed compound");
  await edit.getByRole("button", { name: "Save Component", exact: true }).click();
  await expect(row).toContainText("Renamed compound");
  await expect(field(page, "components.0.actualMass")).toHaveValue("1010");
  await expect(row.locator(".target-mass-cell")).toHaveText("2000.00");
  await expect(detailField(page, "components.0.reviewed")).not.toBeChecked();
});

test("manual creation supports draft-only fields and never changes inventory or existing components", async ({ page }) => {
  await mockInventory(page);
  await page.goto("#buffer");
  await addComponent(page);
  const original = await page.locator(".component-row").textContent();
  let dialog = await openManual(page);
  await dialog.getByLabel("Chemical Name", { exact: true }).fill("Cancelled");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".component-row")).toHaveCount(1);
  dialog = await openManual(page);
  await dialog.getByLabel("Chemical Name", { exact: true }).fill("Manual draft");
  await dialog.getByLabel("Molecular Weight (g/mol)", { exact: true }).fill("-1");
  await dialog.getByRole("button", { name: "Add Component", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("positive number");
  await dialog.getByLabel("Molecular Weight (g/mol)", { exact: true }).fill("");
  await dialog.getByRole("button", { name: "Add Component", exact: true }).click();
  await expect(page.locator(".component-row")).toHaveCount(2);
  expect(await page.locator(".component-row").first().textContent()).toBe(original);
  await expect(field(page, "components.1.mw")).toHaveValue("");
  await page.locator("#inventory-query").fill("Manual draft");
  await expect(page.getByText("No matching inventory entries. Refine your search.")).toBeVisible();
  await page.getByRole("button", { name: "Save Preparation Record", exact: true }).first().click();
  await page.reload();
  await page.getByRole("link", { name: "Records", exact: true }).click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.locator(".component-row").nth(1)).toContainText("Manual draft");
  await expect(page.locator(".component-row").nth(1)).toContainText("Incomplete");
});

test("manual dialog survives a late inventory response and fits desktop, tablet and mobile widths", async ({ page }) => {
  const inventory = publishedInventory();
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/inventory-manifest.json?*", async (route) => {
    await ready;
    await route.fulfill({ json: inventory.manifest });
  });
  await page.route(/\/inventory\.[a-f0-9]{16}\.json$/, (route) => route.fulfill({ body: inventory.text, contentType: "application/json" }));
  await page.goto("#buffer");
  const dialog = await openManual(page);
  await dialog
    .getByLabel("Chemical Name", { exact: true })
    .fill("Manual chemical with a long descriptive name for complete display and record preservation");
  release();
  await expect(page.locator("#inventory-query")).toBeVisible();
  await expect(dialog.getByLabel("Chemical Name", { exact: true })).toHaveValue(/Manual chemical/);
  await dialog.getByText("Supplier and identifiers (optional)", { exact: true }).click();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBeTruthy();
    await expect(dialog.getByRole("button", { name: "Add Component", exact: true })).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Add Component", exact: true }).click();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const row = page.locator(".component-row");
    await row.getByRole("button", { name: "Details", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit Manual Component", exact: true })).toBeVisible();
    expect(await page.locator(".component-details").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBeTruthy();
    await row.getByRole("button", { name: "Collapse", exact: true }).click();
  }
});
