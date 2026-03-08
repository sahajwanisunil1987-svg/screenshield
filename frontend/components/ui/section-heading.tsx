type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate">{description}</p>
    </div>
  );
}
