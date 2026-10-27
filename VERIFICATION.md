# Extraction verification

The initial extraction was verified on 2026-10-26 with Node.js 24.19.0, npm 11.9.0, Playwright Test 1.58.2, and Chromium. The declared minimum Node.js version is 22; no separate Node.js 22 run was performed in this environment. Subsequent feature verification is recorded below.

| Check | Result |
| --- | --- |
| Clean install using the lockfile | Passed: `npm ci` in the standalone project and a second fresh directory |
| Tests before the first build | Passed: 82 unit tests in the fresh source-only directory |
| Demo source validation | Passed: two Demo entries, valid required headers and identifiers |
| Explicit Demo build | Passed: `npm run build -- --demo` |
| Default standalone build | Passed: `npm run build` in the fresh directory |
| Prebuilt release startup | Passed: extracted ZIP starts with `npm start` without `node_modules/`; Demo inventory loads at `/benchwork/` and source/private paths return 404 |
| Browser suite at `/` | Passed: 40 tests |
| Browser suite at `/benchwork/` | Passed: 40 tests in the independently installed copy |
| New `benchwork-calculator` checkout | Passed: clean installation, 82 unit tests, default build, and 40 browser tests at `/benchwork-calculator/` |
| Real published inventory | Passed: actual Demo source loads; JSON checksum and version match the manifest |
| Runtime requests | Passed: no external runtime requests in the navigation/inventory smoke test |
| Deployment configuration | Parsed successfully; manual trigger only, uploads `dist/` only |
| Initial calculation and UI source preservation | All 15 `src/` files matched the existing application byte for byte at extraction; later changes are tracked in this repository |
| Original project preservation | Original commit, working-tree status, and every tracked file hash unchanged |

The independent copy contained no prior build output, `node_modules/`, Git metadata, original checkout, or sibling output directory. It was installed, tested, and built in a directory whose name includes a space, checking path handling as well as root independence.

## Manual components and supplier details — 2026-10-27

Verified **87 unit tests**, **43 browser tests** at `/benchwork-calculator/`, and the default Demo build. The main calculation engine, rule version, and record schema were not changed.

New coverage verifies adding a manual component without a loaded inventory, name-only drafts, invalid-input feedback, cancelling without adding, editing without losing target/observed/stock inputs, review invalidation, and full record/Excel round trips. It also checks a delayed inventory response cannot replace unsaved manual-dialog fields and checks the dialog and expanded component at desktop, tablet, and phone widths.

Supplier details in the form, component summary, full-content viewer, and Excel use **Brand → CAS → Lot → Barcode**. The example `VMR, CAS Z0014, Lot AD32345, Barcode GCR000888` survives record and Excel round trips. Tests cover explicit Brand alongside Company, fallback from older supplier fields, omitted missing values, text identifiers/leading zeros, and retained legacy Vendor ID without substituting it for CAS. Inventory search keeps its previous columns and meaning. Visual checks confirmed readable controls and compact summaries at 1440 px and 320 px.

Manual entries remain preparation-only and have no published/local inventory version. No actual company inventory or saved browser records were added to the repository. This feature update does not deploy a website; the Pages workflow remains manual.

## Functional regression coverage

The unit and browser suites cover both preparation modules, precise unit conversion, direct mass/volume observations and signed error, automatic target mass, both stock calculation directions and mode switching, cocktail volume coordination, minimum aliquots, folded calculations/worksheets, review state, selected calendar dates and day numbers, saved-record reopening, and real Excel file contents.

Inventory checks include CSV/XLSX parsing, encoding and temperature text, paste normalization, invalid-row reports, browser-only local files, Demo load failures/retry, version changes without snapshot mutation, and ignored obsolete caches. Responsive tests check 320, 390, 768, 1024, 1280, 1440, and 1920 px widths with details and result panels expanded.

## File and data review

The release was copied by an explicit allowlist into a newly created directory. Only the workbench application, tests, Demo source/converter, dependency lockfile, standalone scripts/configuration, documentation, and generated static release are included. The archive excludes `.git`, installed dependencies, browser profiles/records, test downloads/screenshots/traces, private sources, and unrelated documents or photos.

Text scans found no original account/repository identifiers, absolute developer filesystem paths, private keys, or recognized access-token patterns. Third-party package metadata, required dependency author attributions, license comments, registry URLs, and loopback preview URLs remain. This is a targeted extraction/data check, not a full dependency security audit.

The only included inventory source is `inventory/demo.csv`, alongside its converter. Built inventory is classified `demo`, has exactly two entries with `DEMO-` barcodes, and matches its SHA-256 manifest. No company inventory or browser preparation records were imported into the project.

`FILE_MANIFEST.txt` lists the reviewed source files, byte sizes, and SHA-256 checksums in this repository. The generated `dist/` release is not committed; it is created by the build. Refresh the source manifest after changing project files.

The initial standalone extraction did not publish anything. At the user's subsequent request, these source files were copied into the separately created `benchwork-calculator` repository. No history from the original repository was imported. The included Pages workflow is for a later explicit manual website deployment; production deployment was not exercised and no collaborator invitations were sent.
