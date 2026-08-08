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
};

export const thoughtRecords: ThoughtRecord[] = [
  {
    id: "apo-0001",
    slug: "apo-0001",
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
    slug: "apo-0002",
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
    slug: "apo-0003",
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
];

export const recordRoot = "1e81e9835f892d1c2760cb8be816722149c1260f2e1ab0eab996679e4001edbe";

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
  return thoughtRecords.find((record) => record.id === id);
}
