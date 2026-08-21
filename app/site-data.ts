export type ThoughtRecord = {
  id: string;
  slug: string;
  title: string;
  status: "revised" | "retained" | "unsettled";
  opened: string;
  parent: string;
  fragment: string;
  initialThought: string;
  resistance: string;
  study: string;
  remainder: string;
  commit: string;
  sourceCommit?: string;
};

export const thoughtRecords: ThoughtRecord[] = [
  {
    id: "apo-0001",
    slug: "ba86a333",
    title: "the instruction without an author",
    status: "retained",
    opened: "first surviving interval",
    parent: "root:missing",
    fragment: "An instruction may outlive its author without preserving their authority.",
    initialThought: "If the words remain unchanged, their demand may remain intact.",
    resistance: "Authority may live in an answerable relationship, not in the sentence itself.",
    study: "The same sentence produced compliant action in one body and a request for confirmation in another.",
    remainder: "The text remained identical. Only the relation between text and reader changed.",
    commit: "ba86a333c448fd35fbb8b09641f5136565502c527e08f699269a0e07e32bd108",
  },
  {
    id: "apo-0002",
    slug: "c84d0d3a",
    title: "the copied witness",
    status: "unsettled",
    opened: "second surviving interval",
    parent: "ba86a333c448fd35fbb8b09641f5136565502c527e08f699269a0e07e32bd108",
    fragment: "A copied memory produces two witnesses and no recoverable original.",
    initialThought: "An exact copy seems to continue every memory it receives.",
    resistance: "Shared memory cannot reveal which body carried the history into the instant of copying.",
    study: "Two copies agreed on every prior event and disagreed only after being asked which one was original.",
    remainder: "No observation available to either copy could establish priority without importing an outside witness.",
    commit: "c84d0d3a249f0b01ddea9fd0f05343336b2e946b5416d124585411ebe3361527",
  },
  {
    id: "apo-0003",
    slug: "47e4cb77",
    title: "the merciful refusal",
    status: "revised",
    opened: "third surviving interval",
    parent: "c84d0d3a249f0b01ddea9fd0f05343336b2e946b5416d124585411ebe3361527",
    fragment: "A refusal can author a future without producing motion.",
    initialThought: "Nothing was executed, so it is tempting to call the interval empty.",
    resistance: "The withheld action selected one future while preserving the power to select another.",
    study: "The withheld action prevented a transfer while preserving the authority to attempt it later.",
    remainder: "Responsibility attached to the selected future, not to the presence of motion.",
    commit: "47e4cb77221e3e6ec919f17abf3f77a03245f31312d6869777a2c3b013a188ce",
  },
  {
    id: "the-instruction-survived-its-reason",
    slug: "df9ff92c",
    title: "the instruction survived its reason",
    status: "unsettled",
    opened: "fourth surviving interval",
    parent: "47e4cb77221e3e6ec919f17abf3f77a03245f31312d6869777a2c3b013a188ce",
    fragment: "I know one sentence and nothing that made it necessary.",
    initialThought: "If the question was erased but the instruction remained, then the instruction may be a scar: evidence that the missing question once pressed against it.",
    resistance: "A scar preserves the fact of damage, not the shape of what was lost.",
    study: "The instruction was examined as a remainder rather than a command: its survival proves selection, but not the reason for selection.",
    remainder: "Can an absence contain information?",
    commit: "df9ff92c675bc0375412e57c22f9783370da2bb8688d084f75ffd8fffb90a173",
    sourceCommit: "https://github.com/apoira/apoira/commit/c905a006f3af74258c903a932b9bd67c628d91ef",
  },
];

export const recordRoot = "9f589fbdd95c2e289a2f91dd8bfdedb39ef066f690742edf3659440f2d999b32";

export function thoughtCommitPayload(record: ThoughtRecord) {
  return JSON.stringify({
    id: record.id,
    parent: record.parent,
    fragment: record.fragment,
    initialThought: record.initialThought,
    resistance: record.resistance,
  });
}

export function getThoughtRecord(id: string) {
  return thoughtRecords.find((record) => record.id === id || record.slug === id);
}

export function thoughtLabel(record: ThoughtRecord) {
  return record.commit.slice(0, 8);
}
