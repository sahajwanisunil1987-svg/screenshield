"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { BulkProductImportResponse, BulkReferenceCheckResponse, BulkSkuCheckResponse } from "@/types";

type AdminProductBulkUploadProps = {
  token?: string | null;
  onImported: () => void;
};

type ParsedCsvRow = Record<string, string>;
type CsvImportRow = {
  rowNumber: number;
  data: ParsedCsvRow;
};

type CsvValidationIssue = {
  rowNumber: number;
  sku: string;
  message: string;
};

const templateHeaders = [
  "name",
  "sku",
  "brand",
  "model",
  "category",
  "price",
  "stock",
  "shortDescription",
  "description",
  "imageUrls",
  "comparePrice",
  "warrantyMonths",
  "gstRate",
  "hsnCode",
  "warehouseCode",
  "videoUrl",
  "isFeatured",
  "isActive",
  "compatibleModels",
  "specifications"
];

const templateRows = [
  templateHeaders.join(","),
  [
    "Oppo A59 5G Display Combo",
    "OPA59-DSP-001",
    "Oppo",
    "OPPO A59 5G",
    "Display",
    "2199",
    "12",
    "Original quality display combo for Oppo A59 5G.",
    "Fast-moving display combo for Oppo A59 5G with tested brightness and touch response.",
    "https://example.com/display-front.jpg|https://example.com/display-angle.jpg",
    "2499",
    "3",
    "18",
    "851770",
    "R1-A",
    "",
    "true",
    "true",
    "OPPO A59 5G",
    "quality=Original;grade=A+;includes=Display combo"
  ].join(",")
].join("\n");

const parseBoolean = (value?: string) => {
  if (!value?.trim()) {
    return false;
  }

  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
};

const parseOptionalNumber = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseRequiredNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePipeList = (value?: string) =>
  (value ?? "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseSpecifications = (value?: string) => {
  const specs: Record<string, string> = {};

  for (const entry of (value ?? "").split(";")) {
    const [rawKey, ...rawValue] = entry.split("=");
    const key = rawKey?.trim();
    const specValue = rawValue.join("=").trim();

    if (key && specValue) {
      specs[key] = specValue;
    }
  }

  return specs;
};

const requiredColumns = ["name", "sku", "brand", "model", "category", "price", "stock", "shortDescription", "description", "imageUrls"];

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseCsv = (csvText: string): CsvImportRow[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Add a header row and at least one product row.");
  }

  const headers = splitCsvLine(lines[0]!).map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const row = headers.reduce<ParsedCsvRow>((accumulator, header, headerIndex) => {
      accumulator[header] = values[headerIndex] ?? "";
      return accumulator;
    }, {});

    return { rowNumber: index + 2, data: row };
  });
};

const analyzeCsv = (csvText: string) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [] as CsvImportRow[],
      validRows: [] as CsvImportRow[],
      invalidRows: [] as CsvImportRow[],
      issues: [{ rowNumber: 1, sku: "-", message: "Add a header row and at least one product row." }],
      missingColumns: [] as string[],
      totalRows: 0
    };
  }

  const headers = splitCsvLine(lines[0]!).map((header) => header.trim());
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
  const rows = parseCsv(csvText);
  const issues: CsvValidationIssue[] = [];
  const seenSkus = new Map<string, number>();

  for (const row of rows) {
    const sku = row.data.sku?.trim() || "-";
    const imageUrls = parsePipeList(row.data.imageUrls);

    if (!row.data.name?.trim()) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Missing product name." });
    }

    if (!row.data.sku?.trim()) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Missing SKU." });
    }

    if (!row.data.brand?.trim()) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Missing brand." });
    }

    if (!row.data.model?.trim()) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Missing model." });
    }

    if (!row.data.category?.trim()) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Missing category." });
    }

    if (!Number.isFinite(Number(row.data.price)) || Number(row.data.price) <= 0) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Price must be greater than 0." });
    }

    if (!Number.isFinite(Number(row.data.stock)) || Number(row.data.stock) < 0) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Stock must be 0 or higher." });
    }

    if ((row.data.shortDescription ?? "").trim().length < 10) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Short description is too short." });
    }

    if ((row.data.description ?? "").trim().length < 20) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Description is too short." });
    }

    if (!imageUrls.length) {
      issues.push({ rowNumber: row.rowNumber, sku, message: "Add at least one image URL." });
    }

    const normalizedSku = sku.toLowerCase();
    if (sku !== "-" && seenSkus.has(normalizedSku)) {
      issues.push({
        rowNumber: row.rowNumber,
        sku,
        message: `Duplicate SKU in file. Also seen on row ${seenSkus.get(normalizedSku)}.`
      });
    } else if (sku !== "-") {
      seenSkus.set(normalizedSku, row.rowNumber);
    }
  }

  if (missingColumns.length) {
    issues.unshift({
      rowNumber: 1,
      sku: "-",
      message: `Missing required columns: ${missingColumns.join(", ")}`
    });
  }

  const invalidRowNumbers = new Set(issues.map((issue) => issue.rowNumber).filter((rowNumber) => rowNumber > 1));
  const invalidRows = rows.filter((row) => invalidRowNumbers.has(row.rowNumber));
  const validRows = rows.filter((row) => !invalidRowNumbers.has(row.rowNumber));

  return {
    rows,
    validRows,
    invalidRows,
    issues,
    missingColumns,
    totalRows: rows.length
  };
};

const buildBulkPayload = (rows: CsvImportRow[]) => ({
  items: rows.map((row) => {
    const imageUrls = parsePipeList(row.data.imageUrls);

    if (!imageUrls.length) {
      throw new Error(`Row ${row.rowNumber}: add at least one image URL in imageUrls.`);
    }

    return {
      rowNumber: row.rowNumber,
      name: row.data.name,
      sku: row.data.sku,
      brand: row.data.brand,
      model: row.data.model,
      category: row.data.category,
      price: parseRequiredNumber(row.data.price, 0),
      stock: parseRequiredNumber(row.data.stock, 0),
      shortDescription: row.data.shortDescription,
      description: row.data.description,
      comparePrice: parseOptionalNumber(row.data.comparePrice),
      warrantyMonths: parseRequiredNumber(row.data.warrantyMonths || "6", 6),
      gstRate: parseRequiredNumber(row.data.gstRate || "18", 18),
      hsnCode: row.data.hsnCode || null,
      warehouseCode: row.data.warehouseCode || undefined,
      videoUrl: row.data.videoUrl || null,
      isFeatured: parseBoolean(row.data.isFeatured),
      isActive: row.data.isActive ? parseBoolean(row.data.isActive) : true,
      compatibleModels: parsePipeList(row.data.compatibleModels),
      specifications: parseSpecifications(row.data.specifications),
      hasVariants: false,
      images: imageUrls.map((url, index) => ({
        url,
        alt: `${row.data.name} image ${index + 1}`
      }))
    };
  })
});

export function AdminProductBulkUpload({ token, onImported }: AdminProductBulkUploadProps) {
  const [csvText, setCsvText] = useState(templateRows);
  const [uploading, setUploading] = useState(false);
  const [checkingSkus, setCheckingSkus] = useState(false);
  const [checkingReferences, setCheckingReferences] = useState(false);
  const [lastResult, setLastResult] = useState<BulkProductImportResponse | null>(null);
  const [existingSkuMap, setExistingSkuMap] = useState<Record<string, { id: string; name: string; slug: string }>>({});
  const [referenceIssues, setReferenceIssues] = useState<CsvValidationIssue[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvAnalysis = useMemo(() => analyzeCsv(csvText), [csvText]);

  const resultSummary = useMemo(() => {
    if (!lastResult) {
      return null;
    }

    return {
      created: lastResult.results.filter((entry) => entry.status === "CREATED").slice(0, 5),
      failed: lastResult.results.filter((entry) => entry.status === "FAILED").slice(0, 5)
    };
  }, [lastResult]);

  useEffect(() => {
    if (!token) {
      setExistingSkuMap({});
      return;
    }

    const skus = Array.from(
      new Set(
        csvAnalysis.validRows
          .map((row) => row.data.sku?.trim())
          .filter((sku): sku is string => Boolean(sku))
      )
    );

    if (!skus.length) {
      setExistingSkuMap({});
      return;
    }

    let cancelled = false;
    setCheckingSkus(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.post<BulkSkuCheckResponse>(
          "/admin/products/bulk/check-skus",
          { skus },
          authHeaders(token)
        );

        if (cancelled) {
          return;
        }

        const mapped = response.data.existing.reduce<Record<string, { id: string; name: string; slug: string }>>((accumulator, item) => {
          accumulator[item.sku.toLowerCase()] = {
            id: item.id,
            name: item.name,
            slug: item.slug
          };
          return accumulator;
        }, {});

        setExistingSkuMap(mapped);
      } catch {
        if (!cancelled) {
          setExistingSkuMap({});
        }
      } finally {
        if (!cancelled) {
          setCheckingSkus(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [csvAnalysis.validRows, token]);

  useEffect(() => {
    if (!token) {
      setReferenceIssues([]);
      return;
    }

    const rows = csvAnalysis.validRows
      .map((row) => ({
        rowNumber: row.rowNumber,
        sku: row.data.sku?.trim(),
        brand: row.data.brand?.trim(),
        model: row.data.model?.trim(),
        category: row.data.category?.trim()
      }))
      .filter(
        (row): row is { rowNumber: number; sku: string; brand: string; model: string; category: string } =>
          Boolean(row.sku && row.brand && row.model && row.category)
      );

    if (!rows.length) {
      setReferenceIssues([]);
      return;
    }

    let cancelled = false;
    setCheckingReferences(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.post<BulkReferenceCheckResponse>(
          "/admin/products/bulk/check-references",
          { rows },
          authHeaders(token)
        );

        if (!cancelled) {
          setReferenceIssues(response.data.issues);
        }
      } catch {
        if (!cancelled) {
          setReferenceIssues([]);
        }
      } finally {
        if (!cancelled) {
          setCheckingReferences(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [csvAnalysis.validRows, token]);

  const existingSkuRows = useMemo(
    () =>
      csvAnalysis.validRows
        .filter((row) => Boolean(existingSkuMap[row.data.sku?.trim().toLowerCase()]))
        .map((row) => ({
          rowNumber: row.rowNumber,
          sku: row.data.sku.trim(),
          product: existingSkuMap[row.data.sku.trim().toLowerCase()]!
        })),
    [csvAnalysis.validRows, existingSkuMap]
  );

  const referenceIssueRows = useMemo(() => {
    const issueMap = new Map<number, CsvValidationIssue[]>();

    for (const issue of referenceIssues) {
      const current = issueMap.get(issue.rowNumber) ?? [];
      current.push(issue);
      issueMap.set(issue.rowNumber, current);
    }

    return issueMap;
  }, [referenceIssues]);

  const blockedReferenceRowCount = referenceIssueRows.size;

  const safeValidRows = useMemo(() => {
    const blockedSkus = new Set(existingSkuRows.map((entry) => entry.sku.toLowerCase()));
    const blockedReferenceRows = new Set(referenceIssues.map((issue) => issue.rowNumber));

    return csvAnalysis.validRows.filter(
      (row) => !blockedSkus.has(row.data.sku.trim().toLowerCase()) && !blockedReferenceRows.has(row.rowNumber)
    );
  }, [csvAnalysis.validRows, existingSkuRows, referenceIssues]);

  const handleTemplateDownload = () => {
    const blob = new Blob([templateRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "purjix-product-bulk-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const content = await file.text();
    setCsvText(content);
    setLastResult(null);
  };

  const handleImport = async () => {
    if (!token) {
      toast.error("Admin session missing. Please log in again.");
      return;
    }

    try {
      setUploading(true);
      if (!safeValidRows.length) {
        throw new Error("No valid rows found. Fix the highlighted CSV issues first.");
      }

      if (csvAnalysis.invalidRows.length || existingSkuRows.length || blockedReferenceRowCount) {
        const confirmed = window.confirm(
          `Import ${safeValidRows.length} safe rows and skip ${csvAnalysis.invalidRows.length + existingSkuRows.length + blockedReferenceRowCount} blocked rows?`
        );

        if (!confirmed) {
          setUploading(false);
          return;
        }
      }

      const payload = buildBulkPayload(safeValidRows);
      const response = await api.post<BulkProductImportResponse>("/admin/products/bulk", payload, authHeaders(token));
      setLastResult(response.data);
      onImported();

      if (response.data.failedCount > 0 || csvAnalysis.invalidRows.length > 0 || existingSkuRows.length > 0 || blockedReferenceRowCount > 0) {
        toast.warning(
          `Imported ${response.data.createdCount} products. ${response.data.failedCount + csvAnalysis.invalidRows.length + existingSkuRows.length + blockedReferenceRowCount} rows need attention.`
        );
      } else {
        toast.success(`${response.data.createdCount} products imported successfully.`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to import products"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-white">Bulk product upload</p>
          <p className="mt-2 text-sm text-white/60">
            Upload many standard products at once with CSV. Use brand, model, and category names as they already
            exist in admin. Variants are not included in this first version.
          </p>
          <p className="mt-3 text-xs text-white/45">
            Template columns: {templateHeaders.join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={handleTemplateDownload}>
            Download template
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
          <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
            Upload CSV
          </Button>
          <Button type="button" onClick={handleImport} disabled={uploading}>
            {uploading ? "Importing..." : "Import products"}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_minmax(280px,0.8fr)]">
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          className="min-h-[260px] w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white placeholder:text-white/35"
          spellCheck={false}
          placeholder="Paste CSV here or upload a file."
        />

        <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
          <p className="text-sm font-semibold text-white">Import safety</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Rows</p>
              <p className="mt-2 font-display text-2xl text-white">{csvAnalysis.totalRows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Valid</p>
              <p className="mt-2 font-display text-2xl text-emerald-100">{safeValidRows.length}</p>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Blocked</p>
              <p className="mt-2 font-display text-2xl text-rose-100">{csvAnalysis.invalidRows.length + existingSkuRows.length + blockedReferenceRowCount}</p>
            </div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>Use exact brand, model, and category names from admin.</li>
            <li>`imageUrls` should be pipe-separated links.</li>
            <li>`compatibleModels` should be pipe-separated names.</li>
            <li>`specifications` format: `key=value;key2=value2`.</li>
            <li>Keep this importer for standard products. Variants can be added later from edit screens.</li>
          </ul>

          {csvAnalysis.issues.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Pre-check issues</p>
              <div className="mt-2 space-y-2 text-sm text-white/70">
                {csvAnalysis.issues.slice(0, 6).map((issue) => (
                  <div key={`${issue.rowNumber}-${issue.sku}-${issue.message}`} className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2">
                    Row {issue.rowNumber} · {issue.sku} · {issue.message}
                  </div>
                ))}
                {csvAnalysis.issues.length > 6 ? (
                  <div className="text-xs text-white/45">+{csvAnalysis.issues.length - 6} more issue(s) hidden</div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              CSV pre-check passed. All rows are ready for import.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/65">
            {checkingSkus ? "Checking existing SKUs in catalog..." : `${existingSkuRows.length} row(s) match existing catalog SKUs and will be skipped.`}
          </div>

          {existingSkuRows.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Existing SKU conflicts</p>
              <div className="mt-2 space-y-2 text-sm text-white/70">
                {existingSkuRows.slice(0, 5).map((entry) => (
                  <div key={`${entry.rowNumber}-${entry.sku}`} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                    Row {entry.rowNumber} · {entry.sku} already exists as{" "}
                    <Link href={`/admin/products/edit/${entry.product.id}`} className="font-semibold text-amber-100 underline">
                      {entry.product.name}
                    </Link>
                  </div>
                ))}
                {existingSkuRows.length > 5 ? (
                  <div className="text-xs text-white/45">+{existingSkuRows.length - 5} more existing SKU conflict(s) hidden</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/65">
            {checkingReferences
              ? "Checking brand, model, and category references..."
              : `${blockedReferenceRowCount} row(s) have missing brand/model/category references and will be skipped.`}
          </div>

          {referenceIssues.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Reference issues</p>
              <div className="mt-2 space-y-2 text-sm text-white/70">
                {Array.from(referenceIssueRows.entries())
                  .slice(0, 5)
                  .map(([rowNumber, issues]) => (
                    <div key={rowNumber} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                      Row {rowNumber} · {(issues[0]?.sku ?? "-")} · {issues.map((issue) => issue.message).join(" ")}
                    </div>
                  ))}
                {referenceIssueRows.size > 5 ? (
                  <div className="text-xs text-white/45">+{referenceIssueRows.size - 5} more reference issue row(s) hidden</div>
                ) : null}
              </div>
            </div>
          ) : null}

          {lastResult ? (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Created</p>
                  <p className="mt-2 font-display text-3xl text-emerald-100">{lastResult.createdCount}</p>
                </div>
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Failed</p>
                  <p className="mt-2 font-display text-3xl text-rose-100">{lastResult.failedCount}</p>
                </div>
              </div>

              {resultSummary?.failed.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Rows to review</p>
                  <div className="mt-2 space-y-2 text-sm text-white/70">
                    {resultSummary.failed.map((entry) => (
                      <div key={`${entry.rowNumber}-${entry.sku}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Row {entry.rowNumber} · {entry.sku} · {entry.message}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {resultSummary?.created.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Recent imports</p>
                  <div className="mt-2 space-y-2 text-sm text-white/70">
                    {resultSummary.created.map((entry) => (
                      <div key={`${entry.rowNumber}-${entry.sku}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Row {entry.rowNumber} · {entry.name} · {entry.sku}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
