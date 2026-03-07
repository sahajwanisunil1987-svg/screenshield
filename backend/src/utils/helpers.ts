import crypto from "crypto";
import slugifyModule from "slugify";

const slugify = slugifyModule as unknown as (value: string, options: Record<string, unknown>) => string;

export const toSlug = (value: string) =>
  slugify(value, { lower: true, strict: true, trim: true });

export const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const createOrderNumber = () => `SK${Date.now().toString().slice(-8)}`;

export const createInvoiceNumber = () => `INV-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;

export const calculateAverage = (ratings: number[]) =>
  ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
