#!/usr/bin/env node

import { findImageReferences, getPrismaClient, summarize, writeReports } from "./cloudinary-image-tools.js";

async function main() {
  const prisma = getPrismaClient();

  try {
    const items = await findImageReferences(prisma);
    const reports = writeReports("cloudinary-image-audit-report", items);
    const summary = summarize(items);

    console.log(`Cloudinary images found: ${summary.totalImages}`);
    console.log(`Unique Cloudinary URLs: ${summary.uniqueCloudinaryUrls}`);
    console.log(`Duplicate URL count: ${summary.duplicateUrlCount}`);
    console.log(`Duplicate references: ${summary.duplicateReferenceCount}`);
    console.log(`Missing name/SKU fallback count: ${summary.missingNameSkuFallbackCount}`);
    console.log("Folder distribution:", JSON.stringify(summary.folderDistribution));
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
