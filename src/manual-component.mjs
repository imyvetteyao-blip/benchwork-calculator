import { componentFromRow } from "./models.mjs";
import { INVENTORY_CONFIG, inventoryMapping, supplierFields } from "./inventory-config.mjs";

const fields = ["name", "mw", "density", "brand", "cas", "lot", "barcode", "vendor", "vendorId"];
export const isManualComponent = (component) => component?.entrySource === "manual";

function identity(values) {
  const input = {};
  for (const key of [...fields, "form"]) {
    const value = values[key] ?? "";
    if (typeof value !== "string") throw new Error(`${INVENTORY_CONFIG.fields[key]?.label || "Physical Form"} must be text.`);
    input[key] = value.trim();
  }
  if (!input.name) throw new Error("Chemical Name is required.");
  for (const key of ["mw", "density"])
    if (input[key] !== "" && (!Number.isFinite(Number(input[key])) || Number(input[key]) <= 0))
      throw new Error(`${INVENTORY_CONFIG.fields[key].label} must be a positive number when provided.`);
  if (!["", "solid", "pure-liquid", "solution"].includes(input.form)) throw new Error("Select a supported Physical Form.");
  const inventory = Object.fromEntries(fields.filter((key) => input[key] !== "").map((key) => [INVENTORY_CONFIG.fields[key].label, input[key]]));
  return {
    name: input.name,
    mw: input.mw,
    density: input.density,
    form: input.form,
    entrySource: "manual",
    inventory,
    inventoryMapping: inventoryMapping(Object.keys(inventory), INVENTORY_CONFIG, false),
    inventorySource: "Manual entry",
    inventoryVersion: null,
    inventoryUpdatedAt: null,
  };
}

export function createManualComponent(values = {}) {
  const details = identity(values);
  return { ...componentFromRow(details.inventory, details.inventoryMapping, details.inventorySource), ...details };
}

export function updateManualComponent(component, values) {
  if (!isManualComponent(component)) throw new Error("Only manually entered components can be edited here.");
  return { ...structuredClone(component), ...identity(values), reviewed: false };
}

export function manualComponentValues(component) {
  if (!component) return {};
  const supplier = supplierFields(component);
  return {
    ...supplier,
    brand: supplier.brand ?? supplier.vendor ?? "",
    name: component.name,
    mw: component.mw,
    density: component.density,
    form: component.form,
  };
}
