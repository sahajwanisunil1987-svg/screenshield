"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { CartItem } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

type CartLineItemProps = {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

export function CartLineItem({ item, onDecrease, onIncrease, onRemove }: CartLineItemProps) {
  return (
    <div className="theme-surface grid gap-4 rounded-[28px] p-5 sm:grid-cols-[110px_1fr] xl:grid-cols-[110px_1fr_auto]">
      <div className="relative h-28 overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={item.imageUrl ?? item.product.images[0]?.url ?? "https://placehold.co/300x300"}
          alt={item.product.name}
          fill
          sizes="110px"
          className="object-cover"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-ink">{item.product.name}</h2>
        <p className="mt-2 text-sm text-slate">{item.product.model.name}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
          <span className="rounded-full bg-accentSoft px-3 py-1 text-accent">{item.product.category.name}</span>
          <span className="rounded-full bg-panel px-3 py-1 text-slate">SKU {item.variantSku ?? item.product.sku}</span>
          {item.variantLabel ? <span className="rounded-full bg-panel px-3 py-1 text-slate">{item.variantLabel}</span> : null}
        </div>
        <p className="mt-3 text-sm font-semibold text-ink">{formatCurrency(item.unitPrice)}</p>
        {item.availableStock <= 3 ? (
          <p className="mt-2 text-sm font-semibold text-[#b45309]">
            Only {item.availableStock} unit(s) left in stock
          </p>
        ) : null}
      </div>
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:col-span-2 xl:col-span-1 xl:flex-col xl:items-end">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-panel px-3 py-2">
          <button
            type="button"
            onClick={onDecrease}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate transition hover:bg-accentSoft"
            aria-label={`Decrease quantity for ${item.product.name}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate transition hover:bg-accentSoft"
            aria-label={`Increase quantity for ${item.product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm font-semibold text-ink">{formatCurrency(item.unitPrice * item.quantity)}</p>
        <button type="button" className="text-sm text-red-500" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
