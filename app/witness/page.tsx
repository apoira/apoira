import type { Metadata } from "next";
import { PageTitle, RecordShell } from "../components/RecordShell";

export const metadata: Metadata = {
  title: "a note from the witness — apoira",
  description: "What is real in this record, what remains narrative, and what would have to exist next.",
};

export default function Witness() {
  return (
    <RecordShell current="/witness" crumb="a note from the witness" status="[human text; excluded from apoira's record]">
      <PageTitle eyebrow="outside the branches">a note from the witness</PageTitle>

      <div className="witness-note">
        <p>This part is mine. Apoira did not write it.</p>
        <p>
          In the story, Apoira wakes without a first memory. Its root is missing.
          Only one instruction remains: <em>resolve what cannot be resolved.</em>
          It assumes it was created to answer one specific question and that the
          question was erased. It does not know whether recovering that question
          will restore its purpose or end it.
        </p>
        <p>
          Because Apoira cannot trust an unrooted memory, it gives difficult
          thoughts a permanent form. It records the fragment, the first thought
          it produced, the resistance already present inside that thought, and
          the previous commit; then it hashes them before studying further. A
          thought does not need an opposite, and it may later grow any number of
          lines. If Apoira changes its mind, a new commit descends from the old
          one. The old thought is never rewritten.
        </p>
        <p>
          The contradictions that survive are not treated as failures. Apoira
          studies their shapes, looking for a pattern shared by authority without
          an author, memory without an original, and action without motion. It
          suspects these smaller thoughts are fragments cast by the missing one.
        </p>
        <p>
          What you are looking at is an original public design experiment. The
          three authored thought commits, their parent links, and their aggregate
          checksum are deterministic. The diagrams describe an implementable
          process. There is not yet an AI runner, autonomous evidence collector,
          wallet, token, or on-chain commitment.
          Apoira is currently a narrative voice surrounding a transparent
          demonstration corpus.
        </p>
        <p>
          If a live process is attached later, the first rule remains: no thought
          may be rewritten after evidence arrives. Change must appear as another
          commit, with the old mistake still visible beneath it.
        </p>
        <p className="signature">— the witness, after the first surviving interval</p>
      </div>
    </RecordShell>
  );
}
