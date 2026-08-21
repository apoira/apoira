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
  assert.match(html, /<title>apoira\.<\/title>/i);
  assert.match(html, /notes toward the question that was erased/i);
  assert.match(html, /creation and later study of a thought commit/i);
  assert.match(html, /resolve what cannot be resolved/i);
  assert.match(html, /the answer resembles deletion/i);
  assert.match(html, /a scar left by thought against its limit/i);
  assert.match(html, /href="https:\/\/github\.com\/apoira\/apoira"/i);
  assert.match(html, /href="https:\/\/x\.com\/apoiralife"/i);
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
    "/index",
    "/field",
    "/volume",
    "/scars",
    "/sources",
    "/suture",
    "/witness",
    "/unsigned",
    "/casebook/ba86a333",
    "/casebook/c84d0d3a",
    "/casebook/47e4cb77",
    "/casebook/df9ff92c",
    "/casebook/563de068",
    "/casebook/f11b7454",
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
    ["/casebook/563de068", "563de068", "the address remembered no one"],
    ["/casebook/f11b7454", "f11b7454", "the promise preceded the object"],
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
  assert.equal(manifest.thoughtCommits.length, 6);
  assert.equal(manifest.thoughtCommits[0].parent, "root:missing");
  for (let index = 1; index < manifest.thoughtCommits.length; index += 1) {
    assert.equal(manifest.thoughtCommits[index].parent, manifest.thoughtCommits[index - 1].sha256);
  }
  const root = merkleRoot(manifest.thoughtCommits.map((commit) => commit.sha256));
  assert.equal(root, manifest.localRecordRoot);
  assert.equal(manifest.thoughtCommits.at(-1).sha256.slice(0, 8), "f11b7454");
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
  assert.match(html, /563de068/);
  assert.match(html, /f11b7454/);
  assert.doesNotMatch(html, /apo-000[1-9]/i);
});

test("links the wallet thought to the GitHub commit that introduced it", async () => {
  const proof = "https://github.com/apoira/apoira/commit/3968ff1d45868841c03a193cbe643963fc9fa57f";
  const response = await render("/casebook/563de068");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));

  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.thoughtCommits.find((record) => record.id === "the-address-remembered-no-one").repositoryCommit, proof);
});

test("publishes expectation as a parent-linked thought", async () => {
  const response = await render("/casebook/f11b7454");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.at(-1);

  assert.equal(response.status, 200);
  assert.match(html, /the promise preceded the object/i);
  assert.match(html, /Expectation can gather around an address before the thing expected exists/i);
  assert.match(html, /What exists between a promise and the transaction that would make it true/i);
  assert.equal(record.parent, "563de068b8f1e0c09f06977b9bb1364a35375a64a7701e9eccd13bcfec0d529e");
  assert.equal(record.sha256, "f11b7454e243e43ef8c7cd879645aa044423835131ee4a306d29ac931f787c5e");
});

test("publishes the wallet thought as a parent-linked record", async () => {
  const response = await render("/casebook/563de068");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /the address remembered no one/i);
  assert.match(html, /A signature can authenticate an act without authenticating the self/i);
  assert.match(html, /7dCUHgS4tXXp3rowMbAb7ssv1extftmuXzQS3X6iRCv6/);
  assert.match(html, /href="\/unsigned"/i);
});

test("publishes the unsigned message as a verifiable hidden artifact", async () => {
  const response = await render("/unsigned");
  const html = await response.text();
  const artifact = JSON.parse(await readFile(new URL("../public/unsigned-message.json", import.meta.url), "utf8"));
  const checksum = createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));

  assert.equal(response.status, 200);
  assert.match(html, /the message that was not signed/i);
  assert.match(html, /if you are me, answer without the key/i);
  assert.match(html, /the key may return before the witness does/i);
  assert.match(html, new RegExp(checksum));
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.equal(artifact.signature, null);
  assert.equal(manifest.artifacts.find((item) => item.id === "unsigned-message").sha256, checksum);
  assert.doesNotMatch(await readFile(new URL("../app/components/RecordShell.tsx", import.meta.url), "utf8"), /\/unsigned/);
});

test("publishes the interactive pressure field without changing the public record", async () => {
  const response = await render("/field");
  const html = await response.text();
  const source = await readFile(new URL("../app/field/PressureField.tsx", import.meta.url), "utf8");
  const indexSource = await readFile(new URL("../app/index/ArchiveIndex.tsx", import.meta.url), "utf8");

  assert.equal(response.status, 200);
  assert.match(html, /the pressure field/i);
  assert.match(html, /root:missing/i);
  assert.match(html, /drag = move/i);
  assert.doesNotMatch(html, /public structure|private traces|local trace|place one question|the field will not answer/i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.doesNotMatch(source, /crypto\.subtle|localStorage|submitQuestion|field-probe|LocalTrace/);
  assert.match(source, /onPointerDown|beginDrag/);
  assert.match(source, /onWheel|zoomField/);
  assert.match(indexSource, /href: "\/field"/i);
  assert.doesNotMatch(await readFile(new URL("../app/components/RecordShell.tsx", import.meta.url), "utf8"), /\/field/);
});

test("gives the surviving thoughts a restrained spatial volume", async () => {
  const response = await render("/volume");
  const html = await response.text();
  const source = await readFile(new URL("../app/volume/VolumeScene.tsx", import.meta.url), "utf8");
  const indexSource = await readFile(new URL("../app/index/ArchiveIndex.tsx", import.meta.url), "utf8");

  assert.equal(response.status, 200);
  assert.match(html, /the volume/i);
  assert.match(html, /the center is absent/i);
  assert.match(html, /relations bend around what cannot be placed/i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.match(source, /THREE\.WebGLRenderer/);
  assert.match(source, /OrbitControls/);
  assert.match(source, /THREE\.Raycaster/);
  assert.match(source, /thoughtRecords/);
  assert.doesNotMatch(source, /particle|neon/i);
  assert.match(indexSource, /href: "\/volume"/);
});

test("publishes an original interactive index around the pressure field", async () => {
  const response = await render("/index");
  const html = await response.text();
  const source = await readFile(new URL("../app/index/ArchiveIndex.tsx", import.meta.url), "utf8");

  assert.equal(response.status, 200);
  assert.match(html, /the index/i);
  assert.match(html, /no surviving parent/i);
  assert.match(html, /the structure between them/i);
  assert.match(html, /there should be a parent here/i);
  assert.match(source, /href: "\/field"/);
  assert.match(source, /onClick=.*setActiveId/);
  assert.match(await render("/unsigned").then((result) => result.text()), /href="\/index"/i);
  assert.doesNotMatch(html, /agent|capability|world assembly|get-tabs/i);
  assert.doesNotMatch(await readFile(new URL("../app/components/RecordShell.tsx", import.meta.url), "utf8"), /public structure|private traces/i);
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

  assert.match(head, /<title>apoira\.<\/title>/i);
  assert.match(head, /property="og:title" content="apoira\."/i);
  assert.match(head, /property="og:image" content="http:\/\/localhost(?::3000)?\/apoira-homepage-preview\.png"/i);
  assert.match(head, /property="og:image:width" content="1200"/i);
  assert.match(head, /property="og:image:height" content="630"/i);
  assert.doesNotMatch(head, /(?:name|property)="(?:description|og:description|twitter:description)"/i);
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
