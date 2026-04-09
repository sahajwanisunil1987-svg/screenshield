import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";

type ContentSection = {
  title: string;
  body: string[];
};

export function ContentPage({
  eyebrow,
  title,
  intro,
  sections,
  supportEmail = "support@purjix,com",
  supportPhone = "+91 99999 99999"
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ContentSection[];
  supportEmail?: string;
  supportPhone?: string;
}) {
  return (
    <PageShell>
      <section className="bg-hero-grid text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base text-white/75 sm:text-lg">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
              <h2 className="font-display text-2xl text-ink">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate sm:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-slate-200 bg-panel p-6 shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Need help?</p>
          <h2 className="mt-3 font-display text-2xl text-ink">Contact PurjiX support</h2>
          <p className="mt-3 text-sm leading-7 text-slate sm:text-base">
            For order help, warranty questions, or compatibility clarification, contact our support team before placing a replacement order.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <a href={`mailto:${supportEmail}`} className="rounded-full bg-accent px-5 py-3 text-white transition hover:bg-teal-700">
              {supportEmail}
            </a>
            <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="rounded-full border border-slate-200 px-5 py-3 text-ink transition hover:bg-white">
              {supportPhone}
            </a>
            <Link href="/track-order" className="rounded-full border border-slate-200 px-5 py-3 text-ink transition hover:bg-white">
              Track order
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
