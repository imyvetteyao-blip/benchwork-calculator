import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { createManualComponent, updateManualComponent, manualComponentValues, isManualComponent } from "../src/manual-component.mjs";
import { blankBuffer, makeRecord, saveRecord, readRecords, decodeRecord, copyRecord, componentFromRow } from "../src/models.mjs";
import { calculateBufferComponent } from "../src/calculations.mjs";
import { supplierFields, inventoryMapping } from "../src/inventory-config.mjs";
import { vendorDescription } from "../src/inventory-view.mjs";
import { createPreparationWorkbook } from "../src/excel.mjs";

test("manual components require only a name and retain their provenance in draft records", () => {
  const component = createManualComponent({ name: "  Unlisted reagent  " });
  assert.equal(component.name, "Unlisted reagent");
  assert.ok(isManualComponent(component));
  assert.equal(component.inventorySource, "Manual entry");
  assert.equal(component.inventoryVersion, null);
  assert.equal(component.inventoryUpdatedAt, null);
  assert.deepEqual(component.inventory, { "Chemical Name": "Unlisted reagent" });
  assert.equal(supplierFields(component).barcode, null);
  assert.notEqual(component.id, createManualComponent({ name: component.name }).id);
  const inputs = { ...blankBuffer(), name: "Manual draft", components: [component] };
  const record = makeRecord("buffer", inputs);
  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  saveRecord(record, storage);
  assert.deepEqual(readRecords(storage)[0], record);
  assert.deepEqual(decodeRecord(JSON.stringify(record)), record);
  assert.ok(isManualComponent(copyRecord(record).inputs.components[0]));
  assert.equal(record.demo, false);
  assert.ok(record.results.errors.length > 0, "Missing calculation inputs must still be reported");
});

test("manual validation keeps full precision and text identifiers without weakening inventory imports", () => {
  for (const [input, error] of [
    [{ name: "  " }, /Chemical Name is required/],
    [{ name: "Reagent", mw: "0" }, /Molecular Weight must be a positive number/],
    [{ name: "Reagent", density: "-1" }, /Density must be a positive number/],
    [{ name: "Reagent", mw: "Infinity" }, /Molecular Weight/],
    [{ name: "Reagent", form: "unknown" }, /Physical Form/],
  ])
    assert.throws(() => createManualComponent(input), error);
  const c = createManualComponent({
    name: "Reagent",
    mw: "100.00000012300",
    cas: "000-00-0",
    barcode: "000001",
    lot: "00002",
    vendor: "Example vendor",
  });
  assert.equal(c.mw, "100.00000012300");
  assert.equal(supplierFields(c).barcode, "000001");
  assert.equal(supplierFields(c).lot, "00002");
  assert.equal(supplierFields(c).cas, "000-00-0");
  assert.ok(!isManualComponent(componentFromRow({}, {}, "local.csv")));
});

test("editing manual metadata uses current calculation fields and retains observations and stock preparation", () => {
  const c = {
    ...createManualComponent({ name: "Original", mw: "100" }),
    mw: "123.456789",
    target: "2",
    actualMass: "0.1010",
    massUnit: "g",
    method: "new",
    stockVolume: "2.5",
    reviewed: true,
  };
  const before = structuredClone(c);
  assert.equal(manualComponentValues(c).mw, "123.456789");
  const changed = updateManualComponent(c, { ...manualComponentValues(c), name: "Updated", vendor: "Supplier", lot: "0001" });
  assert.equal(changed.id, c.id);
  assert.equal(changed.mw, "123.456789");
  assert.equal(changed.inventory[changed.inventoryMapping.name], "Updated");
  for (const key of ["target", "actualMass", "massUnit", "method", "stockVolume"]) assert.equal(changed[key], c[key]);
  assert.equal(changed.reviewed, false);
  assert.deepEqual(c, before);
  assert.throws(() => updateManualComponent(componentFromRow({}, {}, "source.csv"), { name: "Other" }), /Only manually entered/);
});

test("supplier display uses Brand, CAS, Lot and Barcode without changing legacy vendor identifiers", () => {
  const row = {
    "Chemical Name": "Example",
    Brand: "VMR",
    Company: "Distributor",
    CAS: "Z0014",
    Lot: "AD32345",
    Barcode: "GCR000888",
    "Vendor ID": "OLD-ID",
  };
  const c = componentFromRow(row, inventoryMapping(Object.keys(row)), "local.csv", "original-version");
  const before = structuredClone(c);
  assert.equal(vendorDescription(c), "VMR, CAS Z0014, Lot AD32345, Barcode GCR000888");
  assert.deepEqual(c, before);
  const missingCAS = createManualComponent({ name: "Example", brand: "VMR", vendorId: "Z0014", lot: "0001", barcode: "00002" });
  assert.equal(vendorDescription(missingCAS), "VMR, Lot 0001, Barcode 00002");
  assert.equal(supplierFields(missingCAS).vendorId, "Z0014");
  const changed = updateManualComponent(missingCAS, { ...manualComponentValues(missingCAS), cas: "Actual CAS text" });
  assert.equal(supplierFields(changed).vendorId, "Z0014");
  assert.equal(supplierFields(changed).brand, "VMR");
});

test("manual solids, liquids and stocks use the same calculations and sectioned Excel", async () => {
  const solid = {
    ...createManualComponent({
      name: "Manual solid",
      mw: "100",
      form: "solid",
      vendor: "Example vendor",
      vendorId: "001",
      lot: "0002",
      barcode: "00003",
      cas: "000-00-0",
    }),
    target: "10",
    actualMass: "1010",
    reviewed: true,
  };
  const liquid = {
    ...createManualComponent({ name: "Manual liquid", mw: "100", form: "pure-liquid", density: "1.01" }),
    target: "10",
    actualLiquid: "1000",
    reviewed: true,
  };
  const stock = {
    ...createManualComponent({ name: "Manual stock", mw: "100", form: "solid" }),
    target: "0.1",
    actualMass: "100",
    stockVolume: "10",
    reviewed: true,
  };
  const record = makeRecord("buffer", { ...blankBuffer(), name: "Manual recipe", volume: "1000", components: [solid, liquid, stock] }, "Reviewed");
  assert.equal(record.results.rows[0].requiredMg, 1000);
  assert.equal(record.results.rows[0].massErrorPercent, 1);
  assert.equal(record.results.rows[1].massErrorPercent, 1);
  assert.equal(record.results.rows[2].stockTransferUL, 1000);
  assert.equal(calculateBufferComponent(stock, "1000", "mL").method, "new");
  const workbook = await createPreparationWorkbook(record, ExcelJS);
  const roundTrip = new ExcelJS.Workbook();
  await roundTrip.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = roundTrip.getWorksheet("Preparation");
  assert.equal(sheet.getCell("A15").value, "Manual solid");
  assert.equal(sheet.getCell("B15").value, "Example vendor, CAS 000-00-0, Lot 0002, Barcode 00003");
  assert.equal(sheet.getCell("F15").value, 1000);
  assert.equal(sheet.getCell("I15").value, 1);
  assert.match(sheet.getCell("A15").note, /Source: Manual entry/);
  assert.match(sheet.getCell("A15").note, /CAS: 000-00-0/);
  assert.match(sheet.getCell("H16").value, /calculated from density/);
  assert.equal(record.inputs.components[0].entrySource, "manual");
});
