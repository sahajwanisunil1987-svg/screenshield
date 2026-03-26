import { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">{children}</div>
      </div>
    </PageShell>
  );
}
