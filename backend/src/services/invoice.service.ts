import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const formatCurrency = (value: number) => `INR ${value.toFixed(2)}`;
const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
const PAGE_BOTTOM = 720;
const FOOTER_Y = 760;

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

const drawFooter = (doc: PDFKit.PDFDocument) => {
  doc.fillColor("#5b6474").font("Helvetica").fontSize(9);
  doc.text(
    `This is a computer-generated GST invoice issued by ${env.COMPANY_LEGAL_NAME}. For billing support contact ${env.COMPANY_EMAIL} or ${env.COMPANY_PHONE}.`,
    40,
    FOOTER_Y,
    {
      width: 515,
      align: "center"
    }
  );
};

export const generateInvoicePdfBuffer = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
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

  const columns = {
    item: 54,
    sku: 220,
    qty: 305,
    gross: 345,
    taxable: 420,
    amount: 495
  };

  const drawTableHeader = (y: number) => {
    doc.roundedRect(40, y - 12, 515, 28, 10).fill("#e9eef5");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10);
    doc.text("Item", columns.item, y - 3);
    doc.text("SKU", columns.sku, y - 3);
    doc.text("Qty", columns.qty, y - 3);
    doc.text("Gross", columns.gross, y - 3);
    doc.text("Taxable", columns.taxable, y - 3);
    doc.text("Amount", columns.amount, y - 3);
  };

  doc.roundedRect(40, 34, 515, 86, 18).fill("#08111f");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text(`${env.COMPANY_NAME} Tax Invoice`, 58, 54);
  doc.font("Helvetica").fontSize(10).fillColor("#dbe7f3").text(env.COMPANY_LEGAL_NAME, 58, 86);
  doc.text(`${env.COMPANY_ADDRESS_LINE1}, ${env.COMPANY_ADDRESS_LINE2}`, 58, 100, { width: 280 });

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
    132,
    order.paymentStatus === "PAID" ? "#0f766e" : order.paymentStatus === "COD" ? "#92400e" : "#334155"
  );
  drawStatusBadge(
    doc,
    "Order",
    order.status,
    290,
    132,
    order.status === "DELIVERED" ? "#166534" : order.status === "CANCELLED" ? "#991b1b" : "#1d4ed8"
  );

  drawSectionCard(doc, 40, 180, 165, 132, "Invoice Summary");
  drawSectionCard(doc, 215, 180, 165, 132, "Billing Contact");
  drawSectionCard(doc, 390, 180, 165, 132, "Order Address");

  drawLabelValue(doc, "Invoice No", order.invoice.invoiceNumber, 54, 208, 135);
  drawLabelValue(doc, "Order No", order.orderNumber, 54, 246, 135);
  drawLabelValue(doc, "Invoice Date", formatDate(order.invoice.createdAt), 54, 284, 135);
  drawAddressLines(doc, billingContactLines, 229, 208, 137);
  drawAddressLines(doc, orderAddressLines, 404, 208, 137);
  drawLabelValue(doc, "Supply Type", "Domestic taxable supply", 229, 284, 137);
  drawLabelValue(doc, "Currency", "INR", 404, 284, 137);

  const tableTop = 336;
  drawTableHeader(tableTop);

  let y = tableTop + 24;
  order.items.forEach((item, index) => {
    const rowHeight = 34;
    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      drawTableHeader(60);
      y = 84;
    }

    const grossValue = Number(item.totalPrice);
    const allocatedDiscount = subtotal > 0 ? (grossValue / subtotal) * discount : 0;
    const lineTaxableValue = Math.max(grossValue - allocatedDiscount, 0);

    doc.roundedRect(40, y - 8, 515, rowHeight, 8).fill(index % 2 === 0 ? "#ffffff" : "#f9fbfd");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10).text(item.productName, columns.item, y, { width: 155 });
    doc.font("Helvetica").fontSize(9).fillColor("#5b6474").text(item.productSku, columns.sku, y + 1, { width: 70 });
    doc.fillColor("#08111f").fontSize(10).text(String(item.quantity), columns.qty, y + 1);
    doc.text(formatCurrency(grossValue), columns.gross, y + 1, { width: 60 });
    doc.text(formatCurrency(lineTaxableValue), columns.taxable, y + 1, { width: 65 });
    doc.text(formatCurrency(grossValue), columns.amount, y + 1, { width: 55 });
    y += rowHeight + 6;
  });

  let summaryTop = y + 14;
  if (summaryTop + 280 > PAGE_BOTTOM) {
    doc.addPage();
    summaryTop = 60;
  }

  drawSectionCard(doc, 305, summaryTop, 250, 178, "Tax Summary");
  drawLabelValue(doc, "Taxable Value", formatCurrency(taxableValue), 319, summaryTop + 28, 200);
  drawLabelValue(doc, "Shipping", formatCurrency(shipping), 319, summaryTop + 56, 200);
  drawLabelValue(doc, `CGST (${(gstRate / 2).toFixed(1)}%)`, formatCurrency(cgst), 319, summaryTop + 84, 200);
  drawLabelValue(doc, `SGST (${(gstRate / 2).toFixed(1)}%)`, formatCurrency(sgst), 319, summaryTop + 112, 200);
  drawLabelValue(doc, "Amount Payable", formatCurrency(total), 319, summaryTop + 140, 200);

  doc.roundedRect(40, summaryTop, 250, 178, 12).fillAndStroke("#f5f8fb", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Invoice Notes", 54, summaryTop + 14);
  doc.font("Helvetica").fontSize(10).fillColor("#5b6474");
  doc.text("Supply type: Domestic taxable supply", 54, summaryTop + 38);
  doc.text("Currency: INR", 54, summaryTop + 56);
  doc.text(`Payment mode: ${order.payment?.provider ?? order.paymentStatus}`, 54, summaryTop + 74);
  doc.text(`Payment status: ${order.paymentStatus}`, 54, summaryTop + 92);
  doc.text(`Order placed on: ${formatDate(order.createdAt)}`, 54, summaryTop + 110);
  doc.text(`GST charged on order: ${gstRate.toFixed(1)}%`, 54, summaryTop + 128);
  if (order.notes) {
    doc.text(`Notes: ${order.notes}`, 54, summaryTop + 146, { width: 210 });
  }

  doc.roundedRect(40, summaryTop + 194, 515, 78, 12).fillAndStroke("#ffffff", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Declaration", 54, summaryTop + 208);
  doc.font("Helvetica").fontSize(9).fillColor("#5b6474").text(
    `We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This invoice is generated by ${env.COMPANY_LEGAL_NAME}.`,
    54,
    summaryTop + 226,
    { width: 340, lineGap: 2 }
  );
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#08111f").text(`For ${env.COMPANY_LEGAL_NAME}`, 412, summaryTop + 212, {
    width: 120,
    align: "right"
  });
  doc.font("Helvetica").fontSize(9).fillColor("#5b6474").text("Authorised Signatory", 412, summaryTop + 248, {
    width: 120,
    align: "right"
  });

  drawFooter(doc);
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
