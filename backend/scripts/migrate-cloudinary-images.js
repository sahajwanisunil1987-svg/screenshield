#!/usr/bin/env node

import fs from "fs";
import path from "path";
import {
  buildPathParts,
  downloadImage,
  extensionFromContentType,
  extensionFromUrl,
  findImageReferences,
  getPrismaClient,
  summarize,
  updateDatabaseReference,
  writeReports
} from "./cloudinary-image-tools.js";

const mode = process.argv.includes("--apply") ? "apply" : process.argv.includes("--dry-run") ? "dry-run" : "";

if (!mode) {
  console.error("Usage: node backend/scripts/migrate-cloudinary-images.js --dry-run|--apply");
  process.exit(1);
}

async function main() {
  const prisma = getPrismaClient();
  const downloadedByTarget = new Map();

  try {
    const items = await findImageReferences(prisma);
    const summary = summarize(items);

    console.log(`Mode: ${mode}`);
    console.log(`Total images found: ${summary.totalImages}`);
    console.log(`Unique Cloudinary URLs: ${summary.uniqueCloudinaryUrls}`);
    console.log(`Duplicate URL count: ${summary.duplicateUrlCount}`);
    console.log(`Folder distribution: ${JSON.stringify(summary.folderDistribution)}`);

    for (const item of items) {
      console.log(`${item.oldUrl} -> ${item.proposedPublicUrl}`);
    }

    if (mode === "dry-run") {
      const reports = writeReports("cloudinary-image-migration-report", items, { mode });
      console.log(`Wrote ${reports.jsonPath}`);
      console.log(`Wrote ${reports.csvPath}`);
      return;
    }

    for (const item of items) {
      try {
        let finalLocalPath = item.proposedLocalPath;
        let finalPublicUrl = item.proposedPublicUrl;
        let shouldDownload = !downloadedByTarget.has(finalLocalPath) && !fs.existsSync(finalLocalPath);

        if (shouldDownload) {
          const response = await downloadImage(item.oldUrl);
          const responseExt = extensionFromContentType(response.contentType);
          const urlExt = extensionFromUrl(item.oldUrl);
          const finalExt = responseExt || urlExt;

          if (!finalLocalPath.endsWith(`.${finalExt}`)) {
            const specLike = {
              entityType: item.entityType,
              table: item.table,
              field: item.field,
              folder: item.entityType,
              fileBase: () => path.basename(item.proposedLocalPath).replace(/-[a-f0-9]{10}\.[^.]+$/, "")
            };
            const rebuilt = buildPathParts({
              spec: specLike,
              record: { id: item.recordId },
              oldUrl: item.oldUrl,
              ext: finalExt
            });
            finalLocalPath = rebuilt.localPath;
            finalPublicUrl = rebuilt.publicUrl;
            item.proposedLocalPath = finalLocalPath;
            item.proposedPublicUrl = finalPublicUrl;
            shouldDownload = !fs.existsSync(finalLocalPath);
          }

          if (shouldDownload) {
            fs.mkdirSync(path.dirname(finalLocalPath), { recursive: true });
            fs.writeFileSync(finalLocalPath, response.buffer, { flag: "wx" });
          }
          downloadedByTarget.set(finalLocalPath, true);
        }

        await updateDatabaseReference(prisma, item, finalPublicUrl);
        if (item.status !== "unchanged") {
          item.status = fs.existsSync(finalLocalPath) ? "updated" : "updated_existing_file";
        }
        item.error = "";
      } catch (error) {
        item.status = "error";
        item.error = error.message || String(error);
        console.error(`Failed ${item.table}.${item.recordId}.${item.field}: ${item.error}`);
      }
    }

    const reports = writeReports("cloudinary-image-migration-report", items, { mode });
    console.log(`Wrote ${reports.jsonPath}`);
    console.log(`Wrote ${reports.csvPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
