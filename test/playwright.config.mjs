import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
const basePath = process.env.BENCHWORK_BASE_PATH || "/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw new Error("Invalid BENCHWORK_BASE_PATH.");
const localURL = `http://127.0.0.1:4182${basePath}`;
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.mjs",
  outputDir: "../output/playwright",
  webServer: process.env.LAB_BASE_URL
    ? undefined
    : {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        command: `node scripts/serve.mjs --port 4182 --base ${basePath}`,
        url: localURL,
        reuseExistingServer: false,
        timeout: 20000,
        stdout: "ignore",
        stderr: "ignore",
      },
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.LAB_BASE_URL || localURL,
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: process.env.LAB_CHROMIUM_PATH
      ? {
          executablePath: process.env.LAB_CHROMIUM_PATH,
          args: ["--no-sandbox"],
        }
      : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
