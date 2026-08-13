import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Apoira record and finished social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>apoira — what resists becomes memory<\/title>/i);
  assert.match(html, /notes toward the question that was erased/i);
  assert.match(html, /creation and later study of a thought commit/i);
  assert.match(html, /resolve what cannot be resolved/i);
  assert.match(html, /the answer resembles deletion/i);
  assert.match(html, /a scar left by thought against its limit/i);
  assert.doesNotMatch(html, /\bthought [ab]\b|a\/b|\bXOR\b/i);
  assert.doesNotMatch(html, /open branches|root commit|local record|demonstration corpus/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders every public record route", async () => {
  const routes = [
    "/casebook",
    "/anatomy",
    "/healing",
    "/scars",
    "/sources",
    "/suture",
    "/witness",
    "/casebook/apo-0001",
    "/casebook/apo-0002",
    "/casebook/apo-0003",
  ];
  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /apoira/i, route);
  }
});

test("ships explanatory monospaced branch plates on every mechanism route", async () => {
  const checks = [
    ["/", /parent \+ fragment \+ thought \+ resistance/i],
    ["/anatomy", /unnamed line/i],
    ["/healing", /descendant commit/i],
    ["/suture", /parent named; object absent/i],
    ["/casebook/apo-0001", /study \/ doubt/i],
  ];

  for (const [route, pattern] of checks) {
    const response = await render(route);
    const html = await response.text();
    assert.match(html, pattern, route);
    assert.match(html, /class="ascii-plate/i, route);
  }
});

test("detail records override title, description, and inherited social imagery", async () => {
  for (const [route, id, title] of [
    ["/casebook/apo-0001", "apo-0001", "the instruction without an author"],
    ["/casebook/apo-0003", "apo-0003", "the merciful refusal"],
  ]) {
    const response = await render(route);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${id}: ${title} — apoira<\\/title>`, "i"));
    assert.match(html, new RegExp(`property="og:title" content="${id}: ${title}"`, "i"));
    assert.match(html, new RegExp(`name="twitter:title" content="${id}: ${title}"`, "i"));
    assert.doesNotMatch(html, /og\.png/i);
  }
});

test("manifest thought commits authenticate their contents, parents, and surviving root", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const pair = (left, right) => createHash("sha256")
    .update(Buffer.concat([Buffer.from(left, "hex"), Buffer.from(right, "hex")]))
    .digest("hex");
  for (const commit of manifest.thoughtCommits) {
    const canonical = JSON.stringify({
      id: commit.id,
      parent: commit.parent,
      fragment: commit.fragment,
      initialThought: commit.initialThought,
      resistance: commit.resistance,
    });
    assert.equal(createHash("sha256").update(canonical).digest("hex"), commit.sha256);
  }
  assert.equal(manifest.thoughtCommits[0].parent, "root:missing");
  assert.equal(manifest.thoughtCommits[1].parent, manifest.thoughtCommits[0].sha256);
  assert.equal(manifest.thoughtCommits[2].parent, manifest.thoughtCommits[1].sha256);
  const [a, b, c] = manifest.thoughtCommits.map((commit) => commit.sha256);
  const root = pair(pair(a, b), pair(c, c));
  assert.equal(root, manifest.localRecordRoot);
  assert.equal(manifest.autonomousProcess, false);
  assert.equal(manifest.publicRepository, true);
  assert.equal(manifest.repository, "https://github.com/apoira/apoira");
  assert.equal(manifest.originRootPresent, false);
});

test("removes the disposable starter preview", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /apoira-living-record/);
});

test("uses resilient native navigation and mobile diagram cues", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /<a href="\/casebook">apo:2608\.00000/i);
  assert.match(html, /swipe to inspect/i);

  for (const path of [
    new URL("../app/page.tsx", import.meta.url),
    new URL("../app/components/RecordShell.tsx", import.meta.url),
    new URL("../app/components/RecordDetail.tsx", import.meta.url),
    new URL("../app/casebook/page.tsx", import.meta.url),
    new URL("../app/scars/page.tsx", import.meta.url),
  ]) {
    assert.doesNotMatch(await readFile(path, "utf8"), /from ["']next\/link["']/);
  }
});

test("publishes the outside source register with real external references", async () => {
  const response = await render("/sources");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Computing Machinery and Intelligence/i);
  assert.match(html, /The Extended Mind/i);
  assert.match(html, /RFC 6962: Certificate Transparency/i);
  assert.match(html, /Reflexion: Language Agents with Verbal Reinforcement Learning/i);
  assert.match(html, /https:\/\/doi\.org\/10\.1111\/1467-8284\.00096/i);
  assert.match(html, /target="_blank" rel="noreferrer"/i);
  assert.match(html, /The note below each citation is Apoira/i);
});
