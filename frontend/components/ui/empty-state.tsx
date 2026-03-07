type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-card">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm text-slate">{description}</p>
    </div>
  );
}
