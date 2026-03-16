"use client";

import { useState } from "react";
import { ChevronDown, FileText, MessageSquareQuote, SlidersHorizontal, Smartphone } from "lucide-react";
import { ReviewPanel } from "@/components/products/review-panel";
import { MobileModel, Review } from "@/types";

type TabKey = "overview" | "specs" | "compatibility" | "reviews";

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: typeof FileText;
}> = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "specs", label: "Specs", icon: SlidersHorizontal },
  { key: "compatibility", label: "Compatibility", icon: Smartphone },
  { key: "reviews", label: "Reviews", icon: MessageSquareQuote }
];

export function ProductDetailTabs({
  productId,
  description,
  specifications,
  compatibleModels,
  averageRating,
  reviewCount,
  initialReviews
}: {
  productId: string;
  description: string;
  specifications: Record<string, string>;
  compatibleModels: MobileModel[];
  averageRating: number;
  reviewCount: number;
  initialReviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [openSection, setOpenSection] = useState<TabKey>("overview");
  const specificationEntries = Object.entries(specifications);

  const renderTabContent = (tabKey: TabKey) => {
    if (tabKey === "overview") {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-panel p-5">
            <h2 className="text-lg font-semibold text-ink">Detailed description</h2>
            <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
          </div>
          <div className="grid gap-3">
            {specificationEntries.slice(0, 4).map(([key, value]) => (
              <div key={key} className="rounded-[24px] border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate">{key}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tabKey === "specs") {
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {specificationEntries.map(([key, value]) => (
            <div key={key} className="rounded-[24px] border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate">{key}</p>
              <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      );
    }

    if (tabKey === "compatibility") {
      return (
        <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-[28px] bg-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Supported devices</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{compatibleModels.length}</p>
            <p className="mt-2 text-sm leading-6 text-slate">
              Confirm the exact handset model before checkout for the best fitment result.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-ink">Model compatibility</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {compatibleModels.map((model) => (
                <span
                  key={model.id}
                  className="rounded-full bg-panel px-4 py-2 text-sm font-semibold text-ink"
                >
                  {model.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <ReviewPanel
        productId={productId}
        initialReviews={initialReviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />
    );
  };

  return (
    <section className="mt-6 sm:mt-10">
      <div className="theme-surface rounded-[24px] p-3 shadow-card sm:rounded-[32px] sm:p-6">
        <div className="hidden gap-3 overflow-x-auto pb-1 md:flex">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const Icon = tab.icon;
            const countLabel = tab.key === "reviews" ? ` (${reviewCount})` : "";

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-ink text-white shadow-card" : "bg-panel text-slate hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {countLabel}
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5 md:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isOpen = openSection === tab.key;
            const countLabel = tab.key === "reviews" ? ` (${reviewCount})` : "";

            return (
              <div key={tab.key} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenSection((current) => (current === tab.key ? current : tab.key))}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                    <Icon className="h-4 w-4 text-accent" />
                    {tab.label}
                    {countLabel}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen ? <div className="border-t border-slate-200 p-3.5">{renderTabContent(tab.key)}</div> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 hidden md:block">
          {renderTabContent(activeTab)}
        </div>
      </div>
    </section>
  );
}
