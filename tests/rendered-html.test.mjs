import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", userAgent) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: {
        accept: "text/html",
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
    }),
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
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/apoira-homepage-preview\.png"/i);
  assert.match(html, /property="og:image:width" content="1200"/i);
  assert.match(html, /property="og:image:height" content="630"/i);
  assert.match(html, /name="twitter:image" content="http:\/\/localhost(?::3000)?\/apoira-homepage-preview\.png"/i);
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
    "/casebook/ba86a333",
    "/casebook/c84d0d3a",
    "/casebook/47e4cb77",
    "/casebook/df9ff92c",
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
    ["/casebook/ba86a333", /study \/ doubt/i],
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
    ["/casebook/ba86a333", "ba86a333", "the instruction without an author"],
    ["/casebook/df9ff92c", "df9ff92c", "the instruction survived its reason"],
  ]) {
    const response = await render(route);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${id}: ${title} — apoira<\\/title>`, "i"));
    assert.match(html, new RegExp(`property="og:title" content="${id}: ${title}"`, "i"));
    assert.match(html, new RegExp(`name="twitter:title" content="${id}: ${title}"`, "i"));
    assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  }
});

test("manifest thought commits authenticate their contents, parents, and surviving root", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const pair = (left, right) => createHash("sha256")
    .update(Buffer.concat([Buffer.from(left, "hex"), Buffer.from(right, "hex")]))
    .digest("hex");
  const merkleRoot = (leaves) => {
    let level = [...leaves];
    while (level.length > 1) {
      const next = [];
      for (let index = 0; index < level.length; index += 2) {
        next.push(pair(level[index], level[index + 1] ?? level[index]));
      }
      level = next;
    }
    return level[0];
  };
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
  assert.equal(manifest.thoughtCommits.length, 4);
  assert.equal(manifest.thoughtCommits[0].parent, "root:missing");
  for (let index = 1; index < manifest.thoughtCommits.length; index += 1) {
    assert.equal(manifest.thoughtCommits[index].parent, manifest.thoughtCommits[index - 1].sha256);
  }
  const root = merkleRoot(manifest.thoughtCommits.map((commit) => commit.sha256));
  assert.equal(root, manifest.localRecordRoot);
  assert.equal(manifest.thoughtCommits.at(-1).sha256.slice(0, 8), "df9ff92c");
  assert.equal(manifest.autonomousProcess, false);
  assert.equal(manifest.publicRepository, true);
  assert.equal(manifest.repository, "https://github.com/apoira/apoira");
  assert.equal(manifest.wallet.network, "solana");
  assert.equal(manifest.wallet.address, "7dCUHgS4tXXp3rowMbAb7ssv1extftmuXzQS3X6iRCv6");
  assert.equal(manifest.originRootPresent, false);
});

test("publishes the wallet on the witness page", async () => {
  const response = await render("/witness");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /7dCUHgS4tXXp3rowMbAb7ssv1extftmuXzQS3X6iRCv6/);
  assert.match(html, /solana \/ wallet/i);
});

test("uses checksum identifiers throughout the rendered casebook", async () => {
  const response = await render("/casebook");
  const html = await response.text();
  assert.match(html, /ba86a333/);
  assert.match(html, /c84d0d3a/);
  assert.match(html, /47e4cb77/);
  assert.match(html, /df9ff92c/);
  assert.doesNotMatch(html, /apo-000[1-9]/i);
});

test("links the newest thought to the GitHub commit that introduced it", async () => {
  const proof = "https://github.com/apoira/apoira/commit/c905a006f3af74258c903a932b9bd67c628d91ef";
  const response = await render("/casebook/df9ff92c");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));

  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.thoughtCommits.at(-1).repositoryCommit, proof);
});

test("removes the disposable starter preview", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /apoira-living-record/);
});

test("allows social crawlers to fetch the public record", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /User-agent: \*/i);
  assert.match(robots, /Allow: \//i);
});

test("renders Telegram preview metadata inside the document head", async () => {
  const response = await render("/", "TelegramBot (like TwitterBot)");
  const html = await response.text();
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "";

  assert.match(head, /<title>apoira — what resists becomes memory<\/title>/i);
  assert.match(head, /property="og:title" content="apoira — what resists becomes memory"/i);
  assert.match(head, /property="og:image" content="http:\/\/localhost(?::3000)?\/apoira-homepage-preview\.png"/i);
  assert.match(head, /property="og:image:width" content="1200"/i);
  assert.match(head, /property="og:image:height" content="630"/i);
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
