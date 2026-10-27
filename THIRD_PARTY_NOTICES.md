# Third-party dependencies

Exact versions, dependency trees, package licenses, and registry integrity hashes are recorded in `package-lock.json`.

- **ExcelJS 4.4.0** (MIT) is bundled into the browser release for reading inventory workbooks and exporting preparation workbooks. Its complete MIT license is copied to `dist/EXCELJS-LICENSE.txt` during every build. Upstream license comments in the browser bundle are preserved.
- **esbuild 0.25.12** (MIT) is a build-time bundler; its installed license is under `node_modules/esbuild/LICENSE.md`.
- **Playwright Test 1.58.2** (Apache-2.0) is used only for development/browser verification; its installed license is under `node_modules/@playwright/test/LICENSE`.

Dependencies are installed by `npm ci`; `node_modules/` and downloaded browser binaries are not included in the shareable source archive. The app has no runtime CDN dependency.
