import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ensureAppSettings } from "./app-settings.service.js";

const formatCurrency = (value: number) => `INR ${value.toFixed(2)}`;
const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
const PAGE_BOTTOM = 730;
const FOOTER_Y = 780;
const INVOICE_IMAGE_SIZE = 28;

const drawLabelValue = (doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width = 220) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#5b6474").text(label, x, y);
  doc.font("Helvetica").fontSize(10).fillColor("#08111f").text(value, x, y + 12, { width });
};

const drawSectionCard = (doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, title: string) => {
  doc.roundedRect(x, y, width, height, 12).fillAndStroke("#f5f8fb", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text(title, x + 14, y + 12);
};

const drawAddressLines = (doc: PDFKit.PDFDocument, lines: string[], x: number, y: number, width: number) => {
  doc.font("Helvetica").fontSize(10).fillColor("#08111f");
  doc.text(lines.join("\n"), x, y, { width, lineGap: 2 });
};

const drawStatusBadge = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  fillColor: string,
  textColor = "#ffffff"
) => {
  doc.roundedRect(x, y, 120, 34, 10).fill(fillColor);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#dbe7f3").text(label.toUpperCase(), x + 12, y + 7);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(textColor).text(value, x + 12, y + 18);
};

const drawFooter = (doc: PDFKit.PDFDocument, footerNote: string) => {
  doc.fillColor("#5b6474").font("Helvetica").fontSize(9);
  doc.text(
    `${footerNote} Issued by ${env.COMPANY_LEGAL_NAME}. For billing support contact ${env.COMPANY_EMAIL} or ${env.COMPANY_PHONE}.`,
    40,
    FOOTER_Y,
    {
      width: 515,
      align: "center"
    }
  );
};

const loadRemoteImage = async (url?: string | null) => {
  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

export const generateInvoicePdfBuffer = async (orderId: string) => {
  const appSettings = await ensureAppSettings(prisma);
  const siteBaseUrl = env.SITE_URL || env.FRONTEND_URL;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1
              }
            }
          },
          variant: true
        }
      },
      user: true,
      payment: true,
      invoice: true
    }
  });

  if (!order || !order.invoice) {
    throw new Error("Invoice not found");
  }

  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk as Buffer));

  const address = (order.addressSnapshot ?? {}) as Record<string, string | undefined>;
  const orderAddressLines = [
    address.fullName ?? order.invoice.billingName,
    address.line1,
    address.line2,
    address.landmark,
    [address.city, address.state, address.postalCode ?? address.pincode].filter(Boolean).join(", "),
    address.country ?? "India",
    address.phone,
    address.email
  ].filter(Boolean) as string[];
  const billingContactLines = [
    order.invoice.billingName,
    order.invoice.billingPhone ?? address.phone,
    order.invoice.billingEmail ?? address.email,
    `Buyer GSTIN: ${order.gstNumber || order.invoice.gstin || "Not provided"}`
  ].filter(Boolean) as string[];

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discountAmount);
  const shipping = Number(order.shippingAmount);
  const tax = Number(order.taxAmount);
  const total = Number(order.totalAmount);
  const taxableValue = subtotal - discount;
  const gstRate = tax > 0 && taxableValue > 0 ? (tax / taxableValue) * 100 : 0;
  const cgst = tax / 2;
  const sgst = tax / 2;
  const hsnSummaryMap = new Map<string, { taxable: number; tax: number; gstRate: number }>();
  order.items.forEach((item) => {
    const grossValue = Number(item.totalPrice);
    const allocatedDiscount = subtotal > 0 ? (grossValue / subtotal) * discount : 0;
    const lineTaxableValue = Math.max(grossValue - allocatedDiscount, 0);
    const itemGstRate = Number(item.product.gstRate ?? 18);
    const lineTax = lineTaxableValue * (itemGstRate / 100);
    const key = item.product.hsnCode ?? "Unspecified";
    const current = hsnSummaryMap.get(key) ?? { taxable: 0, tax: 0, gstRate: itemGstRate };
    current.taxable += lineTaxableValue;
    current.tax += lineTax;
    current.gstRate = itemGstRate;
    hsnSummaryMap.set(key, current);
  });
  const hsnSummary = Array.from(hsnSummaryMap.entries()).map(([hsn, value]) => ({ hsn, ...value }));
  const uniqueGstRates = Array.from(new Set(hsnSummary.map((entry) => Number(entry.gstRate.toFixed(2)))));
  const cgstLabel = uniqueGstRates.length > 1 ? "CGST (blended)" : `CGST (${(gstRate / 2).toFixed(1)}%)`;
  const sgstLabel = uniqueGstRates.length > 1 ? "SGST (blended)" : `SGST (${(gstRate / 2).toFixed(1)}%)`;
  const itemImageBuffers = await Promise.all(
    order.items.map((item) => loadRemoteImage(item.variant?.imageUrl ?? item.product.images[0]?.url ?? null))
  );
  const companyLogoBuffer = await loadRemoteImage(siteBaseUrl ? `${siteBaseUrl.replace(/\/+$/, "")}/icon-192.png` : null);

  const columns = {
    item: 52,
    hsn: 238,
    sku: 288,
    qty: 360,
    gst: 392,
    taxable: 432,
    amount: 500
  };

  const drawTableHeader = (y: number) => {
    doc.roundedRect(40, y - 12, 515, 28, 10).fill("#e9eef5");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10);
    doc.text("Item", columns.item, y - 3);
    doc.text("HSN", columns.hsn, y - 3);
    doc.text("SKU", columns.sku, y - 3);
    doc.text("Qty", columns.qty, y - 3);
    doc.text("GST", columns.gst, y - 3);
    doc.text("Taxable", columns.taxable, y - 3);
    doc.text("Amount", columns.amount, y - 3);
  };

  doc.roundedRect(40, 34, 515, 82, 18).fill("#08111f");
  if (companyLogoBuffer) {
    try {
      doc.roundedRect(58, 52, 42, 42, 12).fill("#ffffff");
      doc.image(companyLogoBuffer, 62, 56, {
        fit: [34, 34],
        align: "center",
        valign: "center"
      });
    } catch {
      // Ignore logo render failures and continue with text branding only.
    }
  }
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text(`${env.COMPANY_NAME} Tax Invoice`, companyLogoBuffer ? 112 : 58, 54);
  doc.font("Helvetica").fontSize(10).fillColor("#dbe7f3").text(env.COMPANY_LEGAL_NAME, companyLogoBuffer ? 112 : 58, 86);
  doc.text(`${env.COMPANY_ADDRESS_LINE1}, ${env.COMPANY_ADDRESS_LINE2}`, companyLogoBuffer ? 112 : 58, 100, { width: 240 });

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#c9f3ee").text("GSTIN", 390, 54);
  doc.font("Helvetica").fontSize(10).fillColor("#ffffff").text(env.COMPANY_GSTIN, 390, 68);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#c9f3ee").text("Support", 390, 88);
  doc.font("Helvetica").fontSize(10).fillColor("#ffffff").text(`${env.COMPANY_PHONE} · ${env.COMPANY_EMAIL}`, 390, 102, {
    width: 140
  });
  drawStatusBadge(
    doc,
    "Payment",
    order.paymentStatus,
    420,
    124,
    order.paymentStatus === "PAID" ? "#0f766e" : order.paymentStatus === "COD" ? "#92400e" : "#334155"
  );
  drawStatusBadge(
    doc,
    "Order",
    order.status,
    290,
    124,
    order.status === "DELIVERED" ? "#166534" : order.status === "CANCELLED" ? "#991b1b" : "#1d4ed8"
  );

  drawSectionCard(doc, 40, 168, 165, 108, "Invoice Summary");
  drawSectionCard(doc, 215, 168, 165, 108, "Billing Contact");
  drawSectionCard(doc, 390, 168, 165, 108, "Order Address");

  drawLabelValue(doc, "Invoice No", order.invoice.invoiceNumber, 54, 194, 135);
  drawLabelValue(doc, "Order No", order.orderNumber, 54, 228, 135);
  drawLabelValue(doc, "Invoice Date", formatDate(order.invoice.createdAt), 54, 252, 135);
  drawAddressLines(doc, billingContactLines, 229, 194, 137);
  drawAddressLines(doc, orderAddressLines, 404, 194, 137);
  drawLabelValue(doc, "Supply Type", "Domestic taxable supply", 229, 246, 137);
  drawLabelValue(doc, "Currency", "INR", 404, 246, 137);

  const tableTop = 294;
  drawTableHeader(tableTop);

  let y = tableTop + 24;
  order.items.forEach((item, index) => {
    const rowHeight = item.variantLabel ? 38 : 32;
    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      drawTableHeader(60);
      y = 84;
    }

    const grossValue = Number(item.totalPrice);
    const allocatedDiscount = subtotal > 0 ? (grossValue / subtotal) * discount : 0;
    const lineTaxableValue = Math.max(grossValue - allocatedDiscount, 0);
    const itemGstRate = Number(item.product.gstRate ?? 18);
    const itemHsnCode = item.product.hsnCode ?? "-";
    const itemImage = itemImageBuffers[index];

    doc.roundedRect(40, y - 8, 515, rowHeight, 8).fill(index % 2 === 0 ? "#ffffff" : "#f9fbfd");
    const imageX = columns.item;
    const textX = imageX + INVOICE_IMAGE_SIZE + 8;
    doc.roundedRect(imageX, y - 2, INVOICE_IMAGE_SIZE, INVOICE_IMAGE_SIZE, 6).fillAndStroke("#f5f8fb", "#d6dee8");
    if (itemImage) {
      try {
        doc.image(itemImage, imageX + 2, y, {
          fit: [INVOICE_IMAGE_SIZE - 4, INVOICE_IMAGE_SIZE - 4],
          align: "center",
          valign: "center"
        });
      } catch {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#5b6474").text("N/A", imageX + 6, y + 10, { width: 18 });
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#5b6474").text("N/A", imageX + 6, y + 10, { width: 18 });
    }
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10).text(item.productName, textX, y, { width: 142 });
    if (item.variantLabel) {
      doc.font("Helvetica").fontSize(8).fillColor("#5b6474").text(`Variant: ${item.variantLabel}`, textX, y + 12, { width: 142 });
    }
    doc.font("Helvetica").fontSize(9).fillColor("#5b6474").text(itemHsnCode, columns.hsn, y + 1, { width: 48 });
    doc.text(item.productSku, columns.sku, y + 1, { width: 64 });
    doc.fillColor("#08111f").fontSize(10).text(String(item.quantity), columns.qty, y + 1, { width: 24 });
    doc.text(`${itemGstRate.toFixed(0)}%`, columns.gst, y + 1, { width: 36 });
    doc.text(formatCurrency(lineTaxableValue), columns.taxable, y + 1, { width: 68 });
    doc.text(formatCurrency(grossValue), columns.amount, y + 1, { width: 60 });
    y += rowHeight + 3;
  });

  let summaryTop = y + 8;
  const hsnBlockHeight = Math.max(52, hsnSummary.length * 16 + 30);
  const summaryCardHeight = Math.max(138, hsnBlockHeight + 156);
  if (summaryTop + summaryCardHeight + 68 > PAGE_BOTTOM) {
    doc.addPage();
    summaryTop = 60;
  }

  drawSectionCard(doc, 305, summaryTop, 250, 138, "Tax Summary");
  drawLabelValue(doc, "Taxable Value", formatCurrency(taxableValue), 319, summaryTop + 22, 200);
  drawLabelValue(doc, "Shipping", formatCurrency(shipping), 319, summaryTop + 46, 200);
  drawLabelValue(doc, cgstLabel, formatCurrency(cgst), 319, summaryTop + 70, 200);
  drawLabelValue(doc, sgstLabel, formatCurrency(sgst), 319, summaryTop + 94, 200);
  drawLabelValue(doc, "Amount Payable", formatCurrency(total), 319, summaryTop + 118, 200);

  doc.roundedRect(305, summaryTop + 148, 250, hsnBlockHeight, 12).fillAndStroke("#ffffff", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10).text("HSN Tax Breakdown", 319, summaryTop + 160);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#5b6474");
  doc.text("HSN", 319, summaryTop + 178, { width: 44 });
  doc.text("GST", 372, summaryTop + 178, { width: 28 });
  doc.text("Taxable", 410, summaryTop + 178, { width: 52 });
  doc.text("Tax", 490, summaryTop + 178, { width: 40 });
  let hsnY = summaryTop + 194;
  doc.font("Helvetica").fontSize(8).fillColor("#08111f");
  hsnSummary.forEach((entry, index) => {
    if (index > 0) {
      doc.moveTo(319, hsnY - 4).lineTo(541, hsnY - 4).strokeColor("#e6edf5").stroke();
    }
    doc.fillColor("#08111f").text(entry.hsn, 319, hsnY, { width: 44 });
    doc.text(`${entry.gstRate.toFixed(0)}%`, 372, hsnY, { width: 28 });
    doc.text(formatCurrency(entry.taxable), 410, hsnY, { width: 64 });
    doc.text(formatCurrency(entry.tax), 490, hsnY, { width: 45 });
    hsnY += 16;
  });

  doc.roundedRect(40, summaryTop, 250, 138, 12).fillAndStroke("#f5f8fb", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Invoice Notes", 54, summaryTop + 14);
  doc.font("Helvetica").fontSize(9).fillColor("#5b6474");
  doc.text("Supply type: Domestic taxable supply", 54, summaryTop + 34);
  doc.text("Currency: INR", 54, summaryTop + 50);
  doc.text(`Payment mode: ${order.payment?.provider ?? order.paymentStatus}`, 54, summaryTop + 66);
  doc.text(`Payment status: ${order.paymentStatus}`, 54, summaryTop + 82);
  doc.text(`Order placed on: ${formatDate(order.createdAt)}`, 54, summaryTop + 98);
  doc.text(`GST charged on order: blended effective ${gstRate.toFixed(1)}%`, 54, summaryTop + 114, { width: 210 });
  if (order.notes) {
    doc.text(`Notes: ${order.notes}`, 54, summaryTop + 128, { width: 210, lineGap: 1 });
  }

  const declarationTop = summaryTop + summaryCardHeight + 10;
  if (declarationTop + 56 > PAGE_BOTTOM) {
    doc.addPage();
    const newDeclarationTop = 60;
    doc.roundedRect(40, newDeclarationTop, 515, 56, 12).fillAndStroke("#ffffff", "#d6dee8");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Declaration", 54, newDeclarationTop + 12);
    doc.font("Helvetica").fontSize(8).fillColor("#5b6474").text(
      `${appSettings.invoiceDeclaration} This invoice is generated by ${env.COMPANY_LEGAL_NAME}.`,
      54,
      newDeclarationTop + 26,
      { width: 340, lineGap: 1 }
    );
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#08111f").text(`For ${env.COMPANY_LEGAL_NAME}`, 412, newDeclarationTop + 16, {
      width: 120,
      align: "right"
    });
    doc.font("Helvetica").fontSize(8).fillColor("#5b6474").text("Authorised Signatory", 412, newDeclarationTop + 36, {
      width: 120,
      align: "right"
    });
  } else {
    doc.roundedRect(40, declarationTop, 515, 56, 12).fillAndStroke("#ffffff", "#d6dee8");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Declaration", 54, declarationTop + 12);
    doc.font("Helvetica").fontSize(8).fillColor("#5b6474").text(
      `${appSettings.invoiceDeclaration} This invoice is generated by ${env.COMPANY_LEGAL_NAME}.`,
      54,
      declarationTop + 26,
      { width: 340, lineGap: 1 }
    );
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#08111f").text(`For ${env.COMPANY_LEGAL_NAME}`, 412, declarationTop + 16, {
      width: 120,
      align: "right"
    });
    doc.font("Helvetica").fontSize(8).fillColor("#5b6474").text("Authorised Signatory", 412, declarationTop + 36, {
      width: 120,
      align: "right"
    });
  }

  drawFooter(doc, appSettings.invoiceFooterNote ?? "This is a computer-generated GST invoice.");
  doc.end();

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  await prisma.invoice.update({
    where: { orderId },
    data: {
      generatedAt: order.invoice.generatedAt ?? new Date()
    }
  });

  return buffer;
};
