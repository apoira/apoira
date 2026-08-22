import type { ReactNode } from "react";
import Link from "./AppLink";

const access = [
  ["/index", "the index"],
  ["/casebook", "the thought commits"],
  ["/interval", "the interval"],
  ["/anatomy", "how thought grows"],
  ["/healing", "the revision"],
  ["/scars", "the unresolved"],
  ["/suture", "the missing root"],
  ["/witness", "a note from the witness"],
  ["/token", "the object"],
  ["/elsewhere", "elsewhere"],
  ["/sources", "outside sources"],
] as const;

type RecordShellProps = {
  children: ReactNode;
  current?: string;
  crumb?: string;
  status?: string;
  wide?: boolean;
};

export function RecordShell({
  children,
  current,
  crumb,
  wide = false,
}: RecordShellProps) {
  return (
    <main className="page-shell">
      <header className="breadcrumb">
        <Link href="/"><strong>apoira</strong></Link>
        {crumb ? <><span>/</span><span>{crumb}</span></> : null}
      </header>

      <aside className="record-access" aria-label="Contents">
        {access.map(([href, label]) => (
          <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
        <span className="external-rule" />
        <a href="/specimen-manifest.json">public manifest</a>
      </aside>

      <article className={`record${wide ? " record-wide" : ""}`}>
        {children}
      </article>
    </main>
  );
}

export function SpecimenMark() {
  return <pre className="branch-mark" aria-hidden="true">{`        ┆
        ●
      / │ \
     ·  ○  ·`}</pre>;
}

export function PageTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <header className="page-title">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{children}</h1>
    </header>
  );
}

export function Figure({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="mechanism-figure" aria-label={label}>
      <div className="plate-frame">{children}</div>
      <span className="scroll-hint" aria-hidden="true">swipe to inspect ↔</span>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
