import crypto from "crypto";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath, URL } from "url";

const require = createRequire(import.meta.url);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(SCRIPT_DIR, "..");
export const DEFAULT_UPLOAD_ROOT = "/var/www/purjix-uploads";
const PUBLIC_UPLOAD_PREFIX = "/uploads";
const REPORT_COLUMNS = [
  "entityType",
  "table",
  "model",
  "field",
  "recordId",
  "displayName",
  "sku",
  "oldUrl",
  "proposedLocalPath",
  "proposedPublicUrl",
  "duplicateOf",
  "duplicateSafe",
  "usesFallbackName",
  "status",
  "error"
];

const CLOUDINARY_HOST_RE = /(^|\.)res\.cloudinary\.com$/i;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "tif", "tiff", "svg"]);

export const FIELD_SPECS = [
  {
    entityType: "brands",
    model: "brand",
    table: "Brand",
    field: "logoUrl",
    displayName: (record) => record.name,
    sku: () => "",
    fileBase: (record) => firstPresent(record.name, `brand-${record.id}`),
    folder: "brands"
  },
  {
    entityType: "models",
    model: "mobileModel",
    table: "MobileModel",
    field: "imageUrl",
    include: { brand: true },
    displayName: (record) => [record.brand?.name, record.name].filter(Boolean).join(" ") || record.name,
    sku: () => "",
    fileBase: (record) => firstPresent(record.name, `model-${record.id}`),
    folder: "models"
  },
  {
    entityType: "products",
    model: "productImage",
    table: "ProductImage",
    field: "url",
    include: { product: true },
    displayName: (record) => record.product?.name || record.alt || "",
    sku: (record) => record.product?.sku || "",
    fileBase: (record) => productFileBase(record.product?.sku, record.product?.name, record.id),
    folder: "products"
  },
  {
    entityType: "products",
    model: "productVariant",
    table: "ProductVariant",
    field: "imageUrl",
    include: { product: true },
    displayName: (record) => [record.product?.name, record.label].filter(Boolean).join(" - "),
    sku: (record) => record.sku || record.product?.sku || "",
    fileBase: (record) => productFileBase(record.sku || record.product?.sku, record.product?.name || record.label, record.id),
    folder: "products"
  },
  {
    entityType: "banners",
    model: "sponsorAd",
    table: "SponsorAd",
    field: "desktopImageUrl",
    displayName: (record) => record.title || record.name,
    sku: () => "",
    fileBase: (record) => firstPresent(record.title, record.name, `banner-${record.id}`),
    folder: "banners"
  },
  {
    entityType: "banners",
    model: "sponsorAd",
    table: "SponsorAd",
    field: "mobileImageUrl",
    displayName: (record) => record.title || record.name,
    sku: () => "",
    fileBase: (record) => firstPresent(record.title, record.name, `banner-${record.id}`),
    folder: "banners"
  }
];

function loadDotenv() {
  const dotenv = requireOptional("dotenv");
  if (!dotenv) return;

  for (const envPath of [path.join(BACKEND_ROOT, ".env"), path.join(BACKEND_ROOT, "..", ".env")]) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
}

function requireOptional(moduleName) {
  try {
    return require(moduleName);
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    return null;
  }
}

export function getPrismaClient() {
  loadDotenv();
  const prismaModule = requireOptional("@prisma/client");
  if (!prismaModule?.PrismaClient) {
    throw new Error("Could not load @prisma/client. Run npm install and npm run db:generate first.");
  }

  return new prismaModule.PrismaClient();
}

function firstPresent(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function productFileBase(sku, name, id) {
  const skuPart = firstPresent(sku);
  const namePart = firstPresent(name);

  if (skuPart && namePart) return `${skuPart}-${namePart}`;
  if (skuPart) return skuPart;
  if (namePart) return namePart;
  return `product-${id}`;
}

function shortHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function slugify(value, fallback = "image") {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return (normalized || fallback).slice(0, 120);
}

function isCloudinaryUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const parsed = new URL(value);
    return CLOUDINARY_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

function extractCloudinaryUrls(value) {
  if (typeof value === "string") {
    return isCloudinaryUrl(value) ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractCloudinaryUrls(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => extractCloudinaryUrls(entry));
  }

  return [];
}

export function extensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).replace(".", "").toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) ? normalizeExtension(ext) : "jpg";
  } catch {
    return "jpg";
  }
}

export function extensionFromContentType(contentType) {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  const mapping = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/svg+xml": "svg"
  };

  return mapping[type] || "";
}

function normalizeExtension(ext) {
  return ext === "jpeg" ? "jpg" : ext;
}

export function buildPathParts({ spec, record, oldUrl, ext }) {
  const rawBase = spec.fileBase(record);
  const fallbackBase = `${spec.entityType}-${record.id}`;
  const slug = slugify(rawBase, slugify(fallbackBase));
  const hash = shortHash(`${spec.entityType}|${spec.table}|${record.id}|${spec.field}|${oldUrl}`);
  const filename = `${slug}-${hash}.${ext}`;
  const localPath = path.join(DEFAULT_UPLOAD_ROOT, spec.folder, filename);
  const publicUrl = `${PUBLIC_UPLOAD_PREFIX}/${spec.folder}/${filename}`;

  return { filename, localPath, publicUrl, usesFallbackName: usesFallbackName(spec, record) };
}

function usesFallbackName(spec, record) {
  if (spec.entityType === "brands") return !firstPresent(record.name);
  if (spec.entityType === "models") return !firstPresent(record.name);
  if (spec.entityType === "banners") return !firstPresent(record.title, record.name);
  if (spec.model === "productImage") return !firstPresent(record.product?.sku, record.product?.name);
  if (spec.model === "productVariant") return !firstPresent(record.sku, record.product?.sku, record.product?.name, record.label);
  return !firstPresent(spec.fileBase(record));
}

function normalizePlanDuplicates(items) {
  const safeCanonicalByKey = new Map();
  const urlCounts = new Map();

  for (const item of items) {
    urlCounts.set(item.oldUrl, (urlCounts.get(item.oldUrl) || 0) + 1);
  }

  for (const item of items) {
    const safeKey = `${item.oldUrl}||${item.entityType}||${path.dirname(item.proposedLocalPath)}||${path.basename(item.proposedLocalPath).replace(/-[a-f0-9]{10}\.[^.]+$/, "")}`;
    const canonical = safeCanonicalByKey.get(safeKey);

    if (canonical) {
      item.duplicateOf = canonical.oldUrl;
      item.duplicateSafe = true;
      item.proposedLocalPath = canonical.proposedLocalPath;
      item.proposedPublicUrl = canonical.proposedPublicUrl;
      continue;
    }

    safeCanonicalByKey.set(safeKey, item);
    item.duplicateOf = "";
    item.duplicateSafe = false;
  }

  return items;
}

export async function findImageReferences(prisma) {
  const items = [];

  for (const spec of FIELD_SPECS) {
    const delegate = prisma[spec.model];
    if (!delegate?.findMany) continue;

    let records;
    try {
      records = await delegate.findMany({
        ...(spec.include ? { include: spec.include } : {})
      });
    } catch (error) {
      if (isMissingTableError(error)) continue;
      throw error;
    }

    for (const record of records) {
      const urls = extractCloudinaryUrls(record[spec.field]);
      for (const oldUrl of urls) {
        const ext = extensionFromUrl(oldUrl);
        const pathParts = buildPathParts({ spec, record, oldUrl, ext });

        items.push({
          entityType: spec.entityType,
          table: spec.table,
          model: spec.model,
          field: spec.field,
          recordId: record.id,
          displayName: spec.displayName(record) || "",
          sku: spec.sku(record) || "",
          oldUrl,
          proposedLocalPath: pathParts.localPath,
          proposedPublicUrl: pathParts.publicUrl,
          duplicateOf: "",
          duplicateSafe: false,
          usesFallbackName: pathParts.usesFallbackName,
          status: "planned",
          error: ""
        });
      }
    }
  }

  return normalizePlanDuplicates(items);
}

function isMissingTableError(error) {
  return error?.code === "P2021" || /does not exist|not exist|no such table/i.test(error?.message || "");
}

export function summarize(items) {
  const folderDistribution = { brands: 0, models: 0, products: 0, categories: 0, banners: 0, misc: 0 };
  const duplicateUrls = new Map();
  let safeDuplicateMappings = 0;
  let fallbackCount = 0;

  for (const item of items) {
    folderDistribution[item.entityType] = (folderDistribution[item.entityType] || 0) + 1;
    duplicateUrls.set(item.oldUrl, (duplicateUrls.get(item.oldUrl) || 0) + 1);
    if (item.duplicateSafe) safeDuplicateMappings += 1;
    if (item.usesFallbackName) fallbackCount += 1;
  }

  return {
    totalImages: items.length,
    uniqueCloudinaryUrls: duplicateUrls.size,
    duplicateUrlCount: Array.from(duplicateUrls.values()).filter((count) => count > 1).length,
    duplicateReferenceCount: Array.from(duplicateUrls.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    safeDuplicateMappings,
    missingNameSkuFallbackCount: fallbackCount,
    folderDistribution
  };
}

export function writeReports(baseName, items, extra = {}) {
  const jsonPath = path.join(SCRIPT_DIR, `${baseName}.json`);
  const csvPath = path.join(SCRIPT_DIR, `${baseName}.csv`);
  const payload = {
    generatedAt: new Date().toISOString(),
    summary: summarize(items),
    ...extra,
    items
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(csvPath, toCsv(items));

  return { jsonPath, csvPath, payload };
}

function toCsv(items) {
  const rows = [REPORT_COLUMNS.join(",")];

  for (const item of items) {
    rows.push(REPORT_COLUMNS.map((column) => csvEscape(item[column])).join(","));
  }

  return `${rows.join("\n")}\n`;
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function downloadImage(url) {
  const parsed = new URL(url);
  const client = parsed.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const request = client.get(parsed, { headers: { "User-Agent": "purjix-cloudinary-migration/1.0" } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        downloadImage(new URL(response.headers.location, parsed).toString()).then(resolve, reject);
        return;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: response.headers["content-type"] || ""
        });
      });
    });

    request.setTimeout(30000, () => {
      request.destroy(new Error("Download timed out after 30s"));
    });
    request.on("error", reject);
  });
}

function updateValue(value, oldUrl, newUrl) {
  if (typeof value === "string") {
    return value === oldUrl ? newUrl : value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => updateValue(entry, oldUrl, newUrl));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, updateValue(entry, oldUrl, newUrl)]));
  }

  return value;
}

export async function updateDatabaseReference(prisma, item, newUrl) {
  const delegate = prisma[item.model];
  const current = await delegate.findUnique({ where: { id: item.recordId } });
  if (!current) {
    throw new Error(`Record no longer exists: ${item.table}.${item.recordId}`);
  }

  const nextValue = updateValue(current[item.field], item.oldUrl, newUrl);
  if (JSON.stringify(nextValue) === JSON.stringify(current[item.field])) {
    item.status = "unchanged";
    return;
  }

  await delegate.update({
    where: { id: item.recordId },
    data: { [item.field]: nextValue }
  });
}
