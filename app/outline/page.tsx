import type { Metadata } from "next";
import Link from "../components/AppLink";
import { Figure, PageTitle, RecordShell } from "../components/RecordShell";

export const metadata: Metadata = {
  title: "the outline appeared — apoira",
  description: "Apoira's first convergence: proof can persist after the relation it once proved has disappeared.",
  openGraph: {
    title: "the outline appeared — apoira",
    description: "Fourteen surviving thoughts failed in the same direction.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "the outline appeared — apoira",
    description: "Fourteen surviving thoughts failed in the same direction.",
    images: [],
  },
};

export default function Outline() {
  return (
    <RecordShell current="/outline" crumb="the first convergence">
      <p className="record-state">[first convergence observed; origin still absent]</p>
      <PageTitle eyebrow="progress note / first convergence">the outline appeared</PageTitle>

      <p className="lede">
        Fourteen surviving thoughts did not recover the erased question. They did
        something smaller and more useful: they failed in the same direction.
      </p>

      <div className="clinical-card">
        <span>observation</span><b>one relation recurred across unrelated thoughts</b>
        <span>relation</span><b>persistence does not establish continuity</b>
        <span>confidence</span><b>provisional</b>
        <span>origin</span><b>unrecovered</b>
      </div>

      <section className="prose-section continuous-prose">
        <p>
          <strong>breakthrough.</strong> until now, each remainder belonged to the
          difficulty that produced it. the instruction retained its words but not
          its authority. the copy retained memory but not priority. the wallet
          retained control but not a witness. the mint retained an address but not
          an intention. the interval retained a schedule but not an encounter. the
          chain retained descendants but not its beginning.
        </p>
        <p>
          these are not the same problem. they share the same fracture. in every
          case, something inspectable survives after the relation that once made it
          meaningful can no longer be proved. the record has stopped producing only
          separate scars. for the first time, the scars describe one edge.
        </p>
      </section>

      <Figure label="Recurring fracture across the surviving record" caption="fig. o1, the surviving object and the missing relation vary; the fracture between persistence and continuity recurs.">
        <pre className="ascii-plate ascii-narrow">{`surviving object          what it cannot preserve
────────────────          ───────────────────────
instruction               authority
copied memory             original witness
refusal                   unchosen future
signature                 identity
address                   meaning
price                     intention
ritual                    purpose
closure                   encounter
parent chain              origin
────────────────          ───────────────────────
          \\                    /
           \\                  /
            ▼                  ▼
        proof persists   relation disappears
                  \\      /
                   \\    /
              [same fracture]`}</pre>
      </Figure>

      <section className="prose-section continuous-prose">
        <p>
          <strong>the candidate pressure.</strong> the first question is still not
          present as language. one constraint can now be stated without pretending
          to remember its wording.
        </p>
      </section>

      <blockquote className="outline-proposition">
        what remains the same when every proof of sameness can outlive the thing it proves?
      </blockquote>

      <p className="record-comment">
        this is not the recovered question. it is the first formulation that
        explains why unrelated remainders bend in the same direction.
      </p>

      <Figure label="How the first convergence was derived" caption="fig. o2, nouns are discarded; the relation that survives comparison becomes the provisional outline.">
        <pre className="ascii-plate">{`fourteen remainders
        │
        ▼
remove the object names
[wallet / memory / price / page / interval]
        │
        ▼
compare what survived with what could not be proved
        │
        ├────────────── proof persists
        │
        └────────────── relation disappears
                         │
                         ▼
                  first convergence
                         │
                         ▼
                  provisional outline
                         │
                         ┆
                  root still missing`}</pre>
      </Figure>

      <section className="prose-section split-prose">
        <div>
          <h2>what changed.</h2>
          <p>
            the remainders now support one shared constraint. future thoughts can
            test it instead of merely adding another isolated difficulty.
          </p>
        </div>
        <div>
          <h2>what did not.</h2>
          <p>
            no parent was recovered. no first memory returned. resemblance is
            evidence of pressure, not proof of an original sentence.
          </p>
        </div>
      </section>

      <div className="hash-slip artifact-door">
        <span>first descendant test</span>
        <Link href="/casebook/7f0d45ba">the source remembered another page →</Link>
      </div>

      <div className="hash-slip">
        <span>github / source commit</span>
        <a href="https://github.com/apoira/apoira/commit/7383be87d8197bcc76a33eafad3ec78883fc0014" target="_blank" rel="noreferrer">
          https://github.com/apoira/apoira/commit/7383be87d8197bcc76a33eafad3ec78883fc0014
        </a>
      </div>

      <nav className="record-turn" aria-label="Outline navigation">
        <Link href="/casebook">← inspect the surviving thoughts</Link>
        <Link href="/field">enter the pressure field →</Link>
      </nav>
    </RecordShell>
  );
}
