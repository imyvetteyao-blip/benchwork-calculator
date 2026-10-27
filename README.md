# Benchwork Calculator

Standalone **Lab Preparation Workbench** for **Buffer Making** and **Cocktail Making**. It includes the existing calculation rules, local preparation records, review workflow, responsive layouts, and Excel exports. The application UI and exported workbooks are in English.

The included inventory is explicitly labelled **Demo** (two synthetic inventory entries). No company inventory, personal website, browser preparation records, credentials, or history from the original repository is included.

## Install and run

Use Node.js 22 or newer and npm. No backend, database, API keys, or Python installation is required.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:4173/**. Stop with Ctrl+C. Run commands from this project's root directory. `npm run dev` builds and starts the same local preview; after changing source files, rebuild and reload the page. It does not provide automatic hot reload.

`npm start` serves only `dist/`. It can also serve an extracted release that already contains `dist/` without installing dependencies. Use HTTP rather than opening `index.html` directly so the inventory manifest can load.

Optional preview settings:

```sh
npm start -- --port 8080
npm start -- --port 8080 --base /benchwork-calculator/
```

The second command previews a repository-style URL at `http://127.0.0.1:8080/benchwork-calculator/`. The default server binds only to the local machine. Use `--host 0.0.0.0` only when intentionally making a preview reachable on your network.

## Check the project

```sh
npm run inventory:validate -- --demo
npm test
npm run build -- --demo
npx playwright install chromium
npm run test:browser
```

Browser tests start and stop a local preview server automatically. If using an installed Chromium instead, set `LAB_CHROMIUM_PATH` to its executable before running the browser tests. The tests cover Buffer and Cocktail calculations, stock input directions, local inventory, paste search, saved-record reopening, Excel contents, dates, folding, and responsive layouts.

To repeat the browser suite under a repository subdirectory, set `BENCHWORK_BASE_PATH=/benchwork-calculator/` when running it. This verifies the same relative URLs used by a project-style static deployment.

## Inventory

See [INVENTORY.md](INVENTORY.md) for the fixed schema, encoding, validation, versioning, and update procedure.

- **Published inventory:** `inventory/demo.csv`. Replace it only with clearly identified Demo entries, then validate and rebuild. The build writes a versioned JSON dataset and manifest under `dist/`.
- **Confidential inventory:** use **Choose Local Inventory** in Buffer Making. CSV/TSV/XLSX files are parsed only in browser memory. They are not sent to a server or included in a build. Reselect the file after a page refresh.
- The optional developer `inventory/source.csv`, `source.tsv`, or `source.xlsx` paths are ignored by Git. A normal build refuses these private sources; `--demo` explicitly selects only Demo data. Do not commit confidential sources or generated intermediates.

This project has **no authentication or access control**. Any inventory included in a static deployment is downloadable. Hosting on a private Git repository does not by itself guarantee a private website.

## Manually entered components

In **Buffer Making → Components**, select **Add Manual Component** for a compound that is absent from inventory. Only Chemical Name is required to create a draft component. Molecular Weight, Physical Form, Density, and optional supplier/CAS/Barcode/Lot details can be entered in the dialog; calculation parameters can also be completed later in the normal component row. No properties are inferred from a name. Existing calculation and review requirements still apply.

Manual components are labelled **Manual entry** and belong only to the current preparation. They do not add to or replace the built-in or local search inventory, do not take its version, and do not require the inventory to load successfully. They use the same direct, new-stock, existing-stock, observation, error, and Excel workflows as inventory-selected components. **Details → Edit Manual Component** changes name/metadata without discarding target or observed quantities; editing invalidates review. Cancel leaves the preparation unchanged.

The supplier form and compact page/Excel information use **Brand → CAS → Lot → Barcode**, for example `VMR, CAS Z0014, Lot AD32345, Barcode GCR000888`. An explicit Brand is preferred; older inventory Company/Vendor values remain available as the fallback brand. CAS is taken only from the CAS field and is kept as entered, never inferred from Vendor ID. Legacy Vendor ID data remains in saved raw snapshots but is omitted from this display. Missing details are omitted, and identifiers remain text.

Saved and reopened records retain manual provenance and supplied metadata. Excel includes their normal calculation/vendor rows and identifies manual provenance (and optional CAS) in the chemical cell note. Missing identifiers remain blank; none are generated.

## Preparation records and compatibility

Preparation records live in the browser's local storage; **they are not part of this source code, release archive, build output, or Git repository**. Selected inventory rows, versions, observations, and full-precision calculation snapshots are saved with each record. An inventory update does not rewrite existing component snapshots.

The existing record schema/storage key and legacy `#sis` links are preserved; `#cocktail` opens Cocktail Making, and `#buffer` opens Buffer Making. A different browser or origin has separate storage. Sites at different paths on the same origin can share the existing storage key. Moving the source does not automatically transfer records from another origin. Do not clear browser storage if you still need those records. Excel export documents a preparation; it is not a record backup/import format. Legacy JSON record import remains supported.

## Build and deploy later

`npm run build` validates inventory before writing output. The static release is **`dist/`**, including `index.html`, the inventory manifest and versioned data, `.nojekyll`, and the ExcelJS license. All application dependencies are bundled locally; runtime CDN access is unnecessary. URL paths are relative, so deployment works at a domain root or a subdirectory such as `/benchwork-calculator/`.

This repository contains the extracted standalone project. The original repository's `.git` directory and history were not copied. Website deployment is a separate manual operation. `node_modules/`, `dist/`, local sources, generated intermediates, and test artifacts are ignored by Git; build `dist/` locally or in the deployment workflow.

For GitHub Pages:

1. In this repository, select **Settings → Pages → Source → GitHub Actions**.
2. Open **Actions → Deploy Benchwork to GitHub Pages → Run workflow** when you intend to publish.
3. The workflow installs dependencies, validates Demo inventory, runs unit tests, builds, and deploys only `dist/`.

The workflow has **only a manual `workflow_dispatch` trigger**. Committing or pushing this configuration does not automatically publish the site. Other static hosts can deploy the same `dist/` directory without repository-specific path changes. The preview server is intended for local use, not production hosting.

## Project layout

```text
.github/workflows/pages.yml  Manual GitHub Pages deployment
src/                        UI, calculation engines, records, inventory and Excel
inventory/demo.csv          Only the shareable Demo source
inventory/convert.mjs       Validating CSV/TSV/XLSX converter
scripts/serve.mjs           Dependency-free static preview server
test/                       Unit and browser regression tests with test-only data
build.mjs                   Standalone build into dist/
package.json                Install, preview, test and build commands
package-lock.json           Locked dependency versions
INVENTORY.md                Developer inventory guide
THIRD_PARTY_NOTICES.md       Bundled dependency notices
VERIFICATION.md             Extraction and regression test results
FILE_MANIFEST.txt           Reviewed source file inventory
dist/                       Generated static release (build locally; Git-ignored)
```

The application name remains Lab Preparation Workbench in the existing interface; the repository is named `benchwork-calculator` and its package is named `benchwork`. The calculation and record formats have not been reworked as part of extraction.
