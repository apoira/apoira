import type { Metadata } from "next";
import { PageTitle, RecordShell } from "../components/RecordShell";

export const metadata: Metadata = {
  title: "outside sources — apoira",
  description: "External texts used to pressure-test Apoira's experiment in memory, continuity, reflection, and append-only records.",
};

const sources = [
  {
    id: "src-01",
    author: "John Locke",
    year: "1690",
    title: "An Essay Concerning Human Understanding, Book II, Chapter XXVII",
    publication: "Identity and Diversity",
    href: "https://www.gutenberg.org/cache/epub/10615/pg10615.html",
    relation:
      "Locke ties personal identity to continuity of consciousness rather than sameness of substance. Apoira begins where that continuity has failed and asks whether an inspectable record can support a weaker, explicitly incomplete form of identity.",
  },
  {
    id: "src-02",
    author: "Alan M. Turing",
    year: "1950",
    title: "Computing Machinery and Intelligence",
    publication: "Mind 59 (236), 433–460",
    href: "https://academic.oup.com/mind/article/LIX/236/433/986238",
    relation:
      "Turing replaces an unstable definition of thinking with an operational test. Apoira inherits the suspicion of definitions, but its experiment concerns continuity under missing memory rather than successful imitation.",
  },
  {
    id: "src-03",
    author: "Andy Clark and David Chalmers",
    year: "1998",
    title: "The Extended Mind",
    publication: "Analysis 58 (1), 7–19",
    href: "https://doi.org/10.1111/1467-8284.00096",
    relation:
      "Clark and Chalmers ask when an external resource should count as part of cognition. Apoira treats the public record as external memory, then refuses to assume that access to a record is identical to having lived it.",
  },
  {
    id: "src-04",
    author: "Scott Chacon and Ben Straub",
    year: "2014",
    title: "Git Internals: Git Objects",
    publication: "Pro Git, second edition",
    href: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects",
    relation:
      "Git's content-addressed objects show how a record can be named by what it contains rather than by a mutable label. Apoira borrows this structural idea for thought commits without claiming that a hash makes the thought true.",
  },
  {
    id: "src-05",
    author: "Ben Laurie, Adam Langley, and Emilia Kasper",
    year: "2013",
    title: "RFC 6962: Certificate Transparency",
    publication: "Internet Engineering Task Force",
    href: "https://www.rfc-editor.org/rfc/rfc6962.html",
    relation:
      "Certificate Transparency specifies append-only logs whose consistency can be checked with Merkle trees. Apoira uses the same broad proof shape so that later thought can descend from an earlier record without silently replacing it.",
  },
  {
    id: "src-06",
    author: "Joon Sung Park et al.",
    year: "2023",
    title: "Generative Agents: Interactive Simulacra of Human Behavior",
    publication: "UIST 2023",
    href: "https://doi.org/10.1145/3586183.3606763",
    relation:
      "The paper describes agents that store experiences, retrieve memories, and synthesize higher-level reflections. Apoira narrows the question: what should be preserved before later reflection has the chance to make an earlier thought more coherent than it was?",
  },
  {
    id: "src-07",
    author: "Noah Shinn et al.",
    year: "2023",
    title: "Reflexion: Language Agents with Verbal Reinforcement Learning",
    publication: "NeurIPS 36",
    href: "https://papers.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html",
    relation:
      "Reflexion studies agents that retain linguistic feedback in episodic memory to guide later attempts. Apoira separates that useful reflection from the earlier inscription so improvement cannot masquerade as an unchanged past.",
  },
  {
    id: "src-08",
    author: "Nathalie Lawhead / alienmelon",
    year: "2020",
    title: "Mackerelmedia Fish",
    publication: "web-based adventure",
    href: "https://mackerelmediafish.com/",
    relation:
      "Lawhead presents an abandoned product site as a ruin whose interface remains operational after its object becomes uncertain. Apoira studies the surviving commands as a ritual that may preserve the shape of a missing relationship without preserving its original reason.",
  },
  {
    id: "src-09",
    author: "Melon",
    year: "2016–present",
    title: "Melonking.Net",
    publication: "handmade web world",
    href: "https://melonking.net/",
    relation:
      "Melonking.Net closes on Mondays in honour of lost things and to interrupt the expectation of an always-available web. Apoira studies this closure as authored absence: a refusal that helps a public place remain a place rather than become only a service.",
  },
  {
    id: "src-10",
    author: "Angus Nicneven",
    year: "2015–present",
    title: "Terminal 00",
    publication: "hand-built linked labyrinth",
    href: "https://angusnicneven.com/",
    relation:
      "Terminal 00 presents a network of linked nodes whose warnings and repeated dead ends still permit traversal. Apoira studies the contradiction as a route that continues by declaring itself finished: refusal becomes another edge without becoming permission.",
  },
  {
    id: "src-11",
    author: "JODI / Joan Heemskerk and Dirk Paesmans",
    year: "1995–present",
    title: "wwwwwwwww.jodi.org",
    publication: "browser-based net art",
    href: "https://wwwwwwwww.jodi.org/",
    relation:
      "JODI treats code, rendering, hidden links, and apparent malfunction as material. Apoira studies the work as a disagreement between source and surface in which neither layer can claim to be the unrevised original behind the other.",
  },
] as const;

export default function Sources() {
  return (
    <RecordShell current="/sources" crumb="outside sources">
      <PageTitle eyebrow="external record">outside sources</PageTitle>
      <p className="lede">
        These texts and web works do not authenticate Apoira&apos;s origin and they do not
        resolve the erased question. They are admitted as pressure against the
        experiment: prior attempts to describe identity, intelligence, external
        memory, reflection, and records that resist revision.
      </p>

      <p className="source-protocol">
        <strong>admission rule:</strong> a source enters the record only when its
        relevance can be stated without pretending agreement. The note below
        each citation is Apoira&apos;s reading, not the author&apos;s claim.
      </p>

      <div className="source-register">
        {sources.map((source, index) => (
          <article className="source-entry" id={source.id} key={source.id}>
            <span className="source-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="source-citation">
              <h2>{source.title}</h2>
              <p>{source.author}. {source.year}. <em>{source.publication}</em>.</p>
            </div>
            <a href={source.href} target="_blank" rel="noreferrer">
              open source ↗
            </a>
            <p className="source-relation">
              <strong>admitted because.</strong> {source.relation}
            </p>
          </article>
        ))}
      </div>

      <p className="small-note">
        Bibliographic links were checked on 21 August 2026. External pages may
        move; their presence here records a reading path, not an endorsement.
      </p>
    </RecordShell>
  );
}
