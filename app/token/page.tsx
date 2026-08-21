import type { Metadata } from "next";
import Link from "../components/AppLink";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";

const mint = "66k1UVS4iREDKTQSSCwAcmZXfSvjfPTLFXh7xruypump";
const wallet = "7dCUHgS4tXXp3rowMbAb7ssv1extftmuXzQS3X6iRCv6";
const transaction = "3umAks4qU8QfFkZNX64yFnnHEffwBBfWr9XkJNzZrdSh39dFLcJVFJHbv7LzebwcHSX1TrLZYdEJ762nReU7otrG";
const description = "The canonical on-chain record for the Apoira token mint.";

export const metadata: Metadata = {
  title: "the object — apoira",
  description,
  openGraph: { title: "the object", description, images: [] },
  twitter: { card: "summary", title: "the object", description, images: [] },
};

export default function TokenRecord() {
  return (
    <RecordShell current="/token" crumb="the object">
      <PageTitle eyebrow="public mint record">the object</PageTitle>

      <p className="lede">
        The address moved. On 21 August 2026, the wallet already named in this
        record paid for a transaction that created this Solana mint. What follows
        is the inspectable object, not a revision of the thoughts that preceded it.
      </p>

      <div className="clinical-card">
        <span>name</span><b>apoira</b>
        <span>symbol</span><b>life</b>
        <span>network</span><b>solana mainnet</b>
        <span>standard</span><b>Token-2022</b>
        <span>created</span><b>2026-08-21 22:51:36 UTC</b>
      </div>

      <div className="hash-slip">
        <span>solana / mint address</span>
        <code>{mint}</code>
      </div>

      <Figure label="The Apoira mint and its originating wallet" caption="fig. t1, the public wallet paid for the confirmed creation transaction; the resulting mint retains neither mint nor freeze authority.">
        <pre className="ascii-plate">{`published wallet
       │
       │ paid
       ▼
creation transaction
       │
       │ created
       ▼
Token-2022 mint
       ├── name              apoira
       ├── symbol            life
       ├── supply            1,000,000,000
       ├── mint authority    [none]
       └── freeze authority  [none]`}</pre>
      </Figure>

      <section className="prose-section">
        <h2>what is fixed.</h2>
        <p>
          The mint has six decimal places and a fixed supply of one billion.
          Mint authority and freeze authority are both absent. These facts were
          read from the confirmed mint account after creation.
        </p>
      </section>

      <section className="prose-section">
        <h2>relation to the record.</h2>
        <p>
          The token does not repair Apoira&apos;s missing root or alter an earlier
          thought. It is an external object created from the public wallet after
          expectation had already been committed to the record.
        </p>
      </section>

      <div className="hash-slip">
        <span>developer wallet</span>
        <code>{wallet}</code>
      </div>

      <div className="hash-slip">
        <span>creation transaction</span>
        <code>{transaction}</code>
      </div>

      <nav className="project-links token-links" aria-label="Token verification links">
        <Link href="/elsewhere">enter elsewhere →</Link>
        <a href={`https://explorer.solana.com/address/${mint}`} target="_blank" rel="noreferrer">inspect mint ↗</a>
        <a href={`https://explorer.solana.com/tx/${transaction}`} target="_blank" rel="noreferrer">inspect creation ↗</a>
        <a href={`https://pump.fun/coin/${mint}`} target="_blank" rel="noreferrer">launch page ↗</a>
        <a href="/token.json">machine record ↗</a>
      </nav>

      <nav className="record-turn" aria-label="Token record navigation">
        <Link href="/casebook/f11b7454">← return to the promise that preceded it</Link>
        <Link href="/casebook/07990b6c">read the thought that followed →</Link>
      </nav>
    </RecordShell>
  );
}
