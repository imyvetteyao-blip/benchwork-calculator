# Inventory configuration

The shareable release contains **Demo inventory only**. The source is `inventory/demo.csv`; its two entries use a Demo supplier, Demo locations/Lot values, and `DEMO-` barcodes. The website identifies Demo inventory as examples, not a company inventory.

For an individual compound not in inventory, use **Buffer Making → Components → Add Manual Component**. This stores a preparation-only component, labelled Manual entry, without changing this inventory or requiring an inventory file. Name is required; missing calculation parameters and optional supplier identifiers can be completed later. Saved records retain the manual entry and Excel identifies its source.

## Update the shareable Demo

1. Replace `inventory/demo.csv` with the revised Demo data, retaining the fixed headers and clearly labelled Demo identifiers.
2. Run from the project root:

   ```sh
   npm run inventory:validate -- --demo
   npm test
   npm run build -- --demo
   npm run test:browser
   ```

3. Review the built inventory and publish `dist/` only when you explicitly intend to deploy. The included GitHub Pages workflow is manual.

The build validates and converts the source before writing release files. Empty inventories, missing required headers, ambiguous mappings, invalid rows, duplicate barcodes, and non-Demo barcodes in a Demo release stop the build with a specific error. A failed build does not overwrite an existing release; do not mistake an older successful `dist/` for a new build.

## Fixed schema and encoding

`src/inventory-config.mjs` is the central configuration for header position, worksheet selection, field aliases, and legacy encoding. Required headers are **Chemical Name**, **CAS**, and **Barcode**. Molecular Weight and Density are optional and may be entered later on a component.

The default header row is 1. If no exact worksheet name is configured, exactly one XLSX worksheet must match the required column contract. Multiple matching worksheets fail instead of guessing. Barcode values must be nonempty and unique. Names must be nonempty text. Supplied MW and Density must be positive numbers. Keep identifiers as text in XLSX to preserve leading zeros.

Components and Excel show supplier information in **Brand, CAS, Lot, Barcode** order. An optional Brand column can coexist with Company; Brand is preferred for this summary, with Company/Vendor as the fallback for older templates. Inventory search retains its existing Company column and order. Vendor ID is preserved in raw snapshots but is not substituted for CAS or included in the compact supplier summary.

CSV supports strict UTF-8, UTF-8 BOM, BOM-declared UTF-16, and the configured Windows-1252 legacy English Excel encoding. Set the actual legacy encoding in the central configuration if required by your source; do not replace unknown characters globally. CSV has no worksheet configuration.

Developer conversion supports CSV, TSV, and XLSX. A private file can be validated without copying it into the project:

```sh
npm run inventory:validate -- --source "your-inventory.xlsx"
```

`npm run inventory:convert -- --demo` writes optional inspection files to the ignored `generated/` directory; this is not needed before a normal build. The output classification remains explicit.

## Confidential data stays local

Use **Choose Local Inventory** to select a private CSV/TSV/XLSX in the browser. There is no server upload. The UI identifies the active source, filename, import count, and validation results. Local files remain in memory and must be selected again after a refresh. Switching sources does not alter existing components or records. Returning to **Use Published Demo Inventory** changes only new searches.

Local import reports all invalid rows and imports the valid subset. Its persistent warning shows the imported/excluded counts and original source rows; **View excluded rows** provides the full copyable report. Blank rows are ignored. Invalid names, missing barcodes, invalid supplied numbers, and all conflicting duplicate-barcode rows are excluded without inventing data. Invalid headers/encoding or zero usable rows reject the file and retain the previous source.

The reserved developer paths `inventory/source.csv`, `inventory/source.tsv`, and `inventory/source.xlsx` are ignored by Git. Keep at most one. A normal build detects and refuses a private source before writing output. `npm run build -- --demo` explicitly selects only `inventory/demo.csv`, even if a private source exists. Demo builds also reject non-`DEMO-` barcodes. Ignored paths are a precaution, not access control: never force-add confidential data or include it in an archive.

## Versions, refresh, and records

Each build creates a version and UTC update time. `dist/inventory-manifest.json` identifies the matching `inventory.<version>.json` and checksum. The browser fetches the manifest without caching, loads that versioned file, and validates its metadata/checksum. Old browser-uploaded inventory caches cannot override a new release. A load failure displays an explicit error and retry control, rather than an empty search result.

Selected components and saved preparation records retain their own complete inventory snapshots and selected versions. New inventory changes new searches; it cannot silently change a recorded supplier, Barcode, or Lot. Local sources get a file fingerprint. Whole local inventory files and browser preparation records are not shipped with this project.

There is no login or inventory access control. Anyone who can load a static site can download its bundled data. Confidential shared inventory requires separately designed access-controlled hosting and must not be included in this Demo release.
