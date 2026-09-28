import type { ReactNode } from 'react';

export function ReportChapter({
  number,
  title,
  intro,
  children,
}: {
  number: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="report-chapter" aria-labelledby={`chapter-${number}`}>
      <header className="chapter-heading">
        <span>{number}</span>
        <div>
          <h2 id={`chapter-${number}`}>{title}</h2>
          <p>{intro}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
