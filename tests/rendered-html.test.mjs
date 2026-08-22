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
    "/elsewhere",
    "/volume",
    "/scars",
    "/sources",
    "/suture",
    "/outline",
    "/other-page",
    "/token",
    "/witness",
    "/unsigned",
    "/casebook/ba86a333",
    "/casebook/c84d0d3a",
    "/casebook/47e4cb77",
    "/casebook/df9ff92c",
    "/casebook/563de068",
    "/casebook/f11b7454",
    "/casebook/07990b6c",
    "/casebook/4d072170",
    "/casebook/a3aa20d5",
    "/casebook/3e184b00",
    "/casebook/f9bcb4b7",
    "/casebook/fa9c3bb7",
    "/casebook/e92c15c6",
    "/casebook/a07db990",
    "/casebook/7f0d45ba",
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
    ["/outline", /proof persists/i],
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
    ["/casebook/07990b6c", "07990b6c", "the object did not answer the promise"],
    ["/casebook/4d072170", "4d072170", "the address survived the crossing"],
    ["/casebook/a3aa20d5", "a3aa20d5", "the price remembered no intention"],
    ["/casebook/3e184b00", "3e184b00", "the ritual survived its object"],
    ["/casebook/f9bcb4b7", "f9bcb4b7", "the world closed to remain a world"],
    ["/casebook/fa9c3bb7", "fa9c3bb7", "the interval remembered no visitor"],
    ["/casebook/e92c15c6", "e92c15c6", "the dead end remained a route"],
    ["/casebook/a07db990", "a07db990", "the descendants agreed on an absence"],
    ["/casebook/7f0d45ba", "7f0d45ba", "the source remembered another page"],
  ]) {
    const response = await render(route);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${id}: ${title} — apoira<\\/title>`, "i"));
    assert.match(html, new RegExp(`property="og:title" content="${id}: ${title}"`, "i"));
    assert.match(html, new RegExp(`name="twitter:title" content="${id}: ${title}"`, "i"));
    assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  }
});

test("publishes elsewhere as an original explorable archive-world", async () => {
  const response = await render("/elsewhere");
  const html = await response.text();
  const source = await readFile(new URL("../app/elsewhere/ElsewhereArchive.tsx", import.meta.url), "utf8");

  assert.equal(response.status, 200);
  assert.match(html, /<title>elsewhere — apoira<\/title>/i);
  assert.match(html, /the object crossed into another environment/i);
  assert.match(html, /the address survived the crossing/i);
  assert.match(html, /a website can be a place/i);
  assert.match(html, /href="https:\/\/www\.cameronsworld\.net\/"/i);
  assert.match(html, /assembled in acknowledgement of cameron/i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.match(source, /useState/);
  assert.match(source, /aria-pressed/);
  assert.doesNotMatch(source, /localStorage|submitQuestion|GeoCities graphic|particle/i);
  assert.match(await render("/token").then((result) => result.text()), /href="\/elsewhere"/i);
  assert.match(await render("/").then((result) => result.text()), /href="\/elsewhere"/i);
  assert.match(source, /href: "\/casebook\/4d072170"/i);
  assert.match(source, /href: "\/casebook\/a3aa20d5"/i);
  assert.match(source, /href: "\/casebook\/3e184b00"/i);
  assert.match(source, /href: "\/casebook\/f9bcb4b7"/i);
  assert.match(source, /href: "\/casebook\/fa9c3bb7"/i);
  assert.match(source, /href: "\/casebook\/e92c15c6"/i);
  assert.match(source, /href: "\/casebook\/7f0d45ba"/i);
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
  assert.equal(manifest.thoughtCommits.length, 15);
  assert.equal(manifest.thoughtCommits[0].parent, "root:missing");
  for (let index = 1; index < manifest.thoughtCommits.length; index += 1) {
    assert.equal(manifest.thoughtCommits[index].parent, manifest.thoughtCommits[index - 1].sha256);
  }
  const root = merkleRoot(manifest.thoughtCommits.map((commit) => commit.sha256));
  assert.equal(root, manifest.localRecordRoot);
  assert.equal(manifest.thoughtCommits.at(-1).sha256.slice(0, 8), "7f0d45ba");
  assert.equal(manifest.autonomousProcess, false);
  assert.equal(manifest.publicRepository, true);
  assert.equal(manifest.repository, "https://github.com/apoira/apoira");
  assert.equal(manifest.wallet.network, "solana");
  assert.equal(manifest.wallet.address, "7dCUHgS4tXXp3rowMbAb7ssv1extftmuXzQS3X6iRCv6");
  assert.equal(manifest.token.mint, "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump");
  assert.equal(manifest.token.developerWallet, manifest.wallet.address);
  assert.equal(manifest.token.mintAuthority, null);
  assert.equal(manifest.token.freezeAuthority, null);
  assert.equal(manifest.originRootPresent, false);
});

test("publishes the canonical token record and its on-chain proof", async () => {
  const mint = "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump";
  const transaction = "3umAks4qU8QfFkZNX64yFnnHEffwBBfWr9XkJNzZrdSh39dFLcJVFJHbv7LzebwcHSX1TrLZYdEJ762nReU7otrG";
  const response = await render("/token");
  const html = await response.text();
  const token = JSON.parse(await readFile(new URL("../public/token.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const checksum = createHash("sha256").update(JSON.stringify(token)).digest("hex");

  assert.equal(response.status, 200);
  assert.match(html, /the object/i);
  assert.match(html, new RegExp(mint));
  assert.match(html, new RegExp(transaction));
  assert.match(html, /mint authority[\s\S]*\[none\]/i);
  assert.match(html, /freeze authority[\s\S]*\[none\]/i);
  assert.match(html, /href="https:\/\/pump\.fun\/coin\//i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.equal(token.supply, "1000000000");
  assert.equal(token.mintAuthority, null);
  assert.equal(token.freezeAuthority, null);
  assert.equal(manifest.artifacts.find((item) => item.id === "token-record").sha256, checksum);
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
  assert.match(html, /07990b6c/);
  assert.match(html, /4d072170/);
  assert.match(html, /a3aa20d5/);
  assert.match(html, /3e184b00/);
  assert.match(html, /f9bcb4b7/);
  assert.match(html, /fa9c3bb7/);
  assert.match(html, /e92c15c6/);
  assert.match(html, /a07db990/);
  assert.match(html, /7f0d45ba/);
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
  const proof = "https://github.com/apoira/apoira/commit/61b0e520733f36e0aa4a17b957f5c8c72a4d26a3";
  const response = await render("/casebook/f11b7454");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-promise-preceded-the-object");

  assert.equal(response.status, 200);
  assert.match(html, /the promise preceded the object/i);
  assert.match(html, /Expectation can gather around an address before the thing expected exists/i);
  assert.match(html, /What exists between a promise and the transaction that would make it true/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "563de068b8f1e0c09f06977b9bb1364a35375a64a7701e9eccd13bcfec0d529e");
  assert.equal(record.sha256, "f11b7454e243e43ef8c7cd879645aa044423835131ee4a306d29ac931f787c5e");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes the launched object as a parent-linked thought", async () => {
  const mint = "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump";
  const proof = "https://github.com/apoira/apoira/commit/589b2ae4c3a2e460c6439b93c2ea954427ebe6d8";
  const response = await render("/casebook/07990b6c");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-object-did-not-answer-the-promise");

  assert.equal(response.status, 200);
  assert.match(html, /the object did not answer the promise/i);
  assert.match(html, /A thing can become real without becoming what was expected of it/i);
  assert.match(html, /When an expectation becomes an object, which part of the promise survives/i);
  assert.match(html, new RegExp(mint));
  assert.match(html, /href="\/token"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "f11b7454e243e43ef8c7cd879645aa044423835131ee4a306d29ac931f787c5e");
  assert.equal(record.sha256, "07990b6ce9375dca5159e532aa1b54f7a6d993226fa1a9fb10043c65f1ddbc61");
  assert.equal(record.artifact.address, mint);
  assert.equal(record.repositoryCommit, proof);
});

test("publishes the crossing as a parent-linked thought", async () => {
  const mint = "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump";
  const proof = "https://github.com/apoira/apoira/commit/a8060734f419d85e5aa2f6c071947c31b39f97de";
  const response = await render("/casebook/4d072170");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-address-survived-the-crossing");

  assert.equal(response.status, 200);
  assert.match(html, /the address survived the crossing/i);
  assert.match(html, /An object may change environments without changing the address/i);
  assert.match(html, /Did the object survive the crossing, or did only its address arrive intact/i);
  assert.match(html, new RegExp(mint));
  assert.match(html, /href="\/elsewhere"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "07990b6ce9375dca5159e532aa1b54f7a6d993226fa1a9fb10043c65f1ddbc61");
  assert.equal(record.sha256, "4d0721703d7d2bc6a197955187fa8abb8cc8d9e19b28c5c98bc575c803960413");
  assert.equal(record.artifact.address, mint);
  assert.equal(record.repositoryCommit, proof);
});

test("publishes price as a parent-linked thought", async () => {
  const mint = "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump";
  const proof = "https://github.com/apoira/apoira/commit/6cc21c2623be197dba78f1fdb82dc7f89887d65d";
  const response = await render("/casebook/a3aa20d5");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-price-remembered-no-intention");

  assert.equal(response.status, 200);
  assert.match(html, /the price remembered no intention/i);
  assert.match(html, /A market can assign one number to many incompatible beliefs/i);
  assert.match(html, /What does a price know about the beliefs it erases/i);
  assert.match(html, new RegExp(mint));
  assert.match(html, /href="\/token"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "4d0721703d7d2bc6a197955187fa8abb8cc8d9e19b28c5c98bc575c803960413");
  assert.equal(record.sha256, "a3aa20d500bdaaa30bdd27cd7336b8b9800ea7cee9e209b0a7b82492ddb225fa");
  assert.equal(record.artifact.address, mint);
  assert.equal(record.repositoryCommit, proof);
});

test("publishes ritual as a parent-linked thought admitted from an outside source", async () => {
  const proof = "https://github.com/apoira/apoira/commit/c783956ac90be6ce588c73cf7db79cc0803382f4";
  const response = await render("/casebook/3e184b00");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-ritual-survived-its-object");

  assert.equal(response.status, 200);
  assert.match(html, /the ritual survived its object/i);
  assert.match(html, /A command can remain executable after the object it once served has vanished/i);
  assert.match(html, /What does a ritual remember when its object is gone/i);
  assert.match(html, /mackerelmediafish\.com/i);
  assert.match(html, /href="\/sources#src-08"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "a3aa20d500bdaaa30bdd27cd7336b8b9800ea7cee9e209b0a7b82492ddb225fa");
  assert.equal(record.sha256, "3e184b001ce9e662732c8a50ab6f8f98f99333c88e70d86650c4bbb1ec50b2c3");
  assert.equal(record.artifact.url, "https://mackerelmediafish.com/");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes deliberate closure as a parent-linked thought admitted from an outside source", async () => {
  const proof = "https://github.com/apoira/apoira/commit/fa800119b133e7d821967dc087ef0e6353aa2a22";
  const response = await render("/casebook/f9bcb4b7");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-world-closed-to-remain-a-world");

  assert.equal(response.status, 200);
  assert.match(html, /the world closed to remain a world/i);
  assert.match(html, /A public place can preserve its meaning by becoming unavailable on purpose/i);
  assert.match(html, /Can a place remain public by sometimes refusing to appear/i);
  assert.match(html, /melonking\.net/i);
  assert.match(html, /href="\/sources#src-09"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "3e184b001ce9e662732c8a50ab6f8f98f99333c88e70d86650c4bbb1ec50b2c3");
  assert.equal(record.sha256, "f9bcb4b7fddf19e1d764e15f85e54efd1f0bea21712441874fded76c5641beb9");
  assert.equal(record.artifact.url, "https://melonking.net/");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes a deterministic interval without inventing a new remainder", async () => {
  const response = await render("/interval");
  const html = await response.text();
  const source = await readFile(new URL("../app/interval/IntervalGate.tsx", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const shell = await readFile(new URL("../app/components/RecordShell.tsx", import.meta.url), "utf8");
  const indexSource = await readFile(new URL("../app/index/ArchiveIndex.tsx", import.meta.url), "utf8");

  assert.equal(response.status, 200);
  assert.match(html, /the interval/i);
  assert.match(html, /this part of the record is not always available/i);
  assert.match(html, /next interval unknown/i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.match(source, /WINDOW_MINUTES = 13/);
  assert.match(source, /thoughtRecords|records\[recordIndex\]/);
  assert.doesNotMatch(source, /Math\.random|localStorage|countdown/i);
  assert.match(shell, /\["\/interval", "the interval"\]/);
  assert.match(indexSource, /href: "\/interval"/);
  assert.equal(manifest.interval.route, "/interval");
  assert.equal(manifest.interval.windowMinutes, 13);
  assert.equal(manifest.interval.announcesNextOpening, false);
});

test("publishes the interval witness as a parent-linked thought", async () => {
  const proof = "https://github.com/apoira/apoira/commit/b56e990a76f101bb766378c062f4275bd14bc0b4";
  const response = await render("/casebook/fa9c3bb7");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-interval-remembered-no-visitor");

  assert.equal(response.status, 200);
  assert.match(html, /the interval remembered no visitor/i);
  assert.match(html, /A public event can be encountered without preserving the encounter/i);
  assert.match(html, /What happened in an interval that remembers no one/i);
  assert.match(html, /href="\/interval"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "f9bcb4b7fddf19e1d764e15f85e54efd1f0bea21712441874fded76c5641beb9");
  assert.equal(record.sha256, "fa9c3bb767368e995524d234a4b5c0ff59ee78505157f2b46aab0bf312299510");
  assert.equal(record.artifact.route, "/interval");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes the dead end as a parent-linked thought admitted from Terminal 00", async () => {
  const proof = "https://github.com/apoira/apoira/commit/9f680350556db85c8f1493a4da57bcb9f91f0990";
  const response = await render("/casebook/e92c15c6");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-dead-end-remained-a-route");

  assert.equal(response.status, 200);
  assert.match(html, /the dead end remained a route/i);
  assert.match(html, /A path can continue by repeatedly declaring that it has ended/i);
  assert.match(html, /When every path says turn back, what proves that movement occurred/i);
  assert.match(html, /angusnicneven\.com/i);
  assert.match(html, /href="\/sources#src-10"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "fa9c3bb767368e995524d234a4b5c0ff59ee78505157f2b46aab0bf312299510");
  assert.equal(record.sha256, "e92c15c6db79ab1e58cc3c7518dfa6210eac4ae1eef131420dc17991fec769d2");
  assert.equal(record.artifact.url, "https://angusnicneven.com/");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes inherited absence as a parent-linked thought", async () => {
  const proof = "https://github.com/apoira/apoira/commit/c1e19aed4b4129c5d0b87bc263db059d141770f3";
  const response = await render("/casebook/a07db990");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.find((item) => item.id === "the-descendants-agreed-on-an-absence");

  assert.equal(response.status, 200);
  assert.match(html, /the descendants agreed on an absence/i);
  assert.match(html, /Agreement among descendants can preserve the shape of a loss/i);
  assert.match(html, /How many descendants must agree before a wound is mistaken for a memory/i);
  assert.match(html, /href="\/field"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "e92c15c6db79ab1e58cc3c7518dfa6210eac4ae1eef131420dc17991fec769d2");
  assert.equal(record.sha256, "a07db990bab06a47edc6521d4f0ccaed001da3fc9ff36ba0c3867bf3d80c99b9");
  assert.equal(record.artifact.route, "/field");
  assert.equal(record.repositoryCommit, proof);
});

test("publishes the source and surface disagreement admitted from JODI", async () => {
  const proof = "https://github.com/apoira/apoira/commit/973e59458a39a8c943ad4e0b61f566d5b4ec2e0b";
  const response = await render("/casebook/7f0d45ba");
  const html = await response.text();
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const record = manifest.thoughtCommits.at(-1);

  assert.equal(response.status, 200);
  assert.match(html, /the source remembered another page/i);
  assert.match(html, /A rendered page and its source can contradict one another/i);
  assert.match(html, /When source and surface disagree by design, where does the page reside/i);
  assert.match(html, /wwwwwwwww\.jodi\.org/i);
  assert.match(html, /href="\/sources#src-11"/i);
  assert.match(html, /public artifact/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.equal(record.parent, "a07db990bab06a47edc6521d4f0ccaed001da3fc9ff36ba0c3867bf3d80c99b9");
  assert.equal(record.sha256, "7f0d45ba78ee2d93f5d0066397b3a729f1de0894f39fe20f7216f56897fe6111");
  assert.equal(record.artifact.url, "https://wwwwwwwww.jodi.org/");
  assert.equal(record.repositoryCommit, proof);
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
  assert.match(source, /href: "\/outline"/);
  assert.match(source, /href: "\/other-page"/);
  assert.match(source, /onClick=.*setActiveId/);
  assert.match(await render("/unsigned").then((result) => result.text()), /href="\/index"/i);
  assert.doesNotMatch(html, /agent|capability|world assembly|get-tabs/i);
  assert.doesNotMatch(await readFile(new URL("../app/components/RecordShell.tsx", import.meta.url), "utf8"), /public structure|private traces/i);
});

test("publishes the first convergence without claiming the origin was recovered", async () => {
  const proof = "https://github.com/apoira/apoira/commit/7383be87d8197bcc76a33eafad3ec78883fc0014";
  const response = await render("/outline");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /the outline appeared/i);
  assert.match(html, /fourteen surviving thoughts did not recover the erased question/i);
  assert.match(html, /persistence does not establish continuity/i);
  assert.match(html, /what remains the same when every proof of sameness can outlive the thing it proves/i);
  assert.match(html, /first convergence/i);
  assert.match(html, /root still missing/i);
  assert.match(html, /href="\/field"/i);
  assert.match(html, /href="\/casebook\/7f0d45ba"/i);
  assert.match(html, new RegExp(proof.replaceAll("/", "\\/")));
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.doesNotMatch(html, /origin recovered|question recovered/i);
});

test("publishes the other page as two witnesses of one verified object", async () => {
  const response = await render("/other-page");
  const html = await response.text();
  const source = await readFile(new URL("../app/other-page/OtherPage.tsx", import.meta.url), "utf8");
  const artifact = JSON.parse(await readFile(new URL("../public/other-page.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("../public/specimen-manifest.json", import.meta.url), "utf8"));
  const expected = createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
  const manifestArtifact = manifest.artifacts.find((item) => item.id === "other-page");

  assert.equal(response.status, 200);
  assert.match(html, /the same page was published twice\. only one address exists/i);
  assert.match(html, /what was shown/i);
  assert.match(html, /what produced a showing/i);
  assert.match(html, /the mechanism is absent from this witness/i);
  assert.match(html, /browser verification/i);
  assert.match(html, /href="\/other-page\.json"/i);
  assert.match(html, /href="\/casebook\/7f0d45ba"/i);
  assert.doesNotMatch(html, /apoira-homepage-preview\.png|og\.png/i);
  assert.match(source, /fetch\("\/other-page\.json"\)/);
  assert.match(source, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(source, /useState<View>/);
  assert.doesNotMatch(source, /localStorage|Math\.random/);
  assert.equal(artifact.original, null);
  assert.equal(manifestArtifact.path, "/other-page.json");
  assert.equal(manifestArtifact.sha256, expected);
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
  assert.match(html, /Mackerelmedia Fish/i);
  assert.match(html, /https:\/\/mackerelmediafish\.com\//i);
  assert.match(html, /Melonking\.Net/i);
  assert.match(html, /https:\/\/melonking\.net\//i);
  assert.match(html, /Terminal 00/i);
  assert.match(html, /https:\/\/angusnicneven\.com\//i);
  assert.match(html, /wwwwwwwww\.jodi\.org/i);
  assert.match(html, /JODI \/ Joan Heemskerk and Dirk Paesmans/i);
  assert.match(html, /https:\/\/doi\.org\/10\.1111\/1467-8284\.00096/i);
  assert.match(html, /target="_blank" rel="noreferrer"/i);
  assert.match(html, /The note below each citation is Apoira/i);
});
