import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPreviewServer } from "../scripts/serve.mjs";

async function withPreview(base, run) {
  const temp = await mkdtemp(join(tmpdir(), "benchwork-preview-"));
  const root = join(temp, "dist");
  let server;
  try {
    await mkdir(root);
    await writeFile(join(root, "index.html"), "<!doctype html><title>Benchwork preview</title>");
    await writeFile(join(root, "inventory-manifest.json"), JSON.stringify({ demo: true }));
    await writeFile(join(temp, "private.csv"), "DO NOT SERVE");
    await symlink(join(temp, "private.csv"), join(root, "escape.csv"));
    server = await createPreviewServer({ root, base });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    await run(`http://127.0.0.1:${server.address().port}`, base);
  } finally {
    if (server?.listening) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await rm(temp, { recursive: true, force: true });
  }
}

test("standalone preview serves a root or repository subpath with fresh inventory responses", async () => {
  for (const base of ["/", "/benchwork/"]) {
    await withPreview(base, async (origin) => {
      const page = await fetch(origin + base);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /Benchwork preview/);
      const inventory = await fetch(origin + base + "inventory-manifest.json?refresh=1");
      assert.equal(inventory.status, 200);
      assert.match(inventory.headers.get("content-type"), /application\/json/);
      assert.equal(inventory.headers.get("cache-control"), "no-store");
      assert.deepEqual(await inventory.json(), { demo: true });
      const head = await fetch(origin + base, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), "");
    });
  }
});

test("preview cannot expose sources, escaped paths, dotfiles, or symlinks outside dist", async () => {
  await withPreview("/benchwork/", async (origin, base) => {
    for (const path of ["private.csv", "../private.csv", "%2e%2e%2fprivate.csv", ".env", "escape.csv", "src/app.mjs", "inventory/source.csv"]) {
      const response = await fetch(origin + base + path);
      assert.equal(response.status, 404, path);
      assert.doesNotMatch(await response.text(), /DO NOT SERVE/);
    }
    assert.equal((await fetch(origin + "/")).status, 404);
    const redirect = await fetch(origin + "/benchwork", { redirect: "manual" });
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get("location"), "/benchwork/");
    const post = await fetch(origin + base, { method: "POST", body: "secret" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");
  });
});
