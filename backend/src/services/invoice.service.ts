import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const formatCurrency = (value: number) => `INR ${value.toFixed(2)}`;

const drawLabelValue = (doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#5b6474").text(label, x, y);
  doc.font("Helvetica").fontSize(10).fillColor("#08111f").text(value, x, y + 12, {
    width: 220
  });
};

const drawSectionCard = (doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, title: string) => {
  doc.roundedRect(x, y, width, height, 12).fillAndStroke("#f5f8fb", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text(title, x + 14, y + 12);
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
  const billingLines = [
    order.invoice.billingName,
    address.line1,
    address.line2,
    address.landmark,
    [address.city, address.state, address.postalCode ?? address.pincode].filter(Boolean).join(", "),
    address.country ?? "India",
    order.invoice.billingPhone ?? address.phone,
    order.invoice.billingEmail ?? address.email
  ].filter(Boolean) as string[];

  const gstRate = Number(order.taxAmount) > 0 && Number(order.subtotal) > 0 ? (Number(order.taxAmount) / Number(order.subtotal)) * 100 : 0;
  const cgst = Number(order.taxAmount) / 2;
  const sgst = Number(order.taxAmount) / 2;

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

  drawSectionCard(doc, 40, 138, 250, 130, "Invoice Summary");
  drawSectionCard(doc, 305, 138, 250, 130, "Bill To / Ship To");

  drawLabelValue(doc, "Invoice No", order.invoice.invoiceNumber, 54, 166);
  drawLabelValue(doc, "Order No", order.orderNumber, 54, 204);
  drawLabelValue(
    doc,
    "Invoice Date",
    new Date(order.invoice.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }),
    170,
    166
  );
  drawLabelValue(
    doc,
    "Payment",
    order.payment?.provider ? `${order.payment.provider} / ${order.payment.status}` : order.paymentStatus,
    170,
    204
  );
  drawLabelValue(doc, "Customer", order.user.name, 319, 166);
  drawLabelValue(doc, "GSTIN", order.gstNumber || order.invoice.gstin || "Not provided", 319, 204);

  doc.font("Helvetica").fontSize(10).fillColor("#08111f");
  doc.text(billingLines.join("\n"), 319, 182, { width: 210, lineGap: 2 });

  const tableTop = 292;
  const columns = {
    item: 54,
    sku: 250,
    qty: 355,
    rate: 405,
    amount: 475
  };

  doc.roundedRect(40, tableTop - 12, 515, 28, 10).fill("#e9eef5");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10);
  doc.text("Item", columns.item, tableTop - 3);
  doc.text("SKU", columns.sku, tableTop - 3);
  doc.text("Qty", columns.qty, tableTop - 3);
  doc.text("Rate", columns.rate, tableTop - 3);
  doc.text("Amount", columns.amount, tableTop - 3);

  let y = tableTop + 24;
  order.items.forEach((item, index) => {
    const rowHeight = 34;
    doc.roundedRect(40, y - 8, 515, rowHeight, 8).fill(index % 2 === 0 ? "#ffffff" : "#f9fbfd");
    doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(10).text(item.productName, columns.item, y, { width: 180 });
    doc.font("Helvetica").fontSize(9).fillColor("#5b6474").text(item.productSku, columns.sku, y + 1, { width: 90 });
    doc.fillColor("#08111f").fontSize(10).text(String(item.quantity), columns.qty, y + 1);
    doc.text(formatCurrency(Number(item.unitPrice)), columns.rate, y + 1);
    doc.text(formatCurrency(Number(item.totalPrice)), columns.amount, y + 1);
    y += rowHeight + 6;
  });

  const summaryTop = y + 14;
  drawSectionCard(doc, 305, summaryTop, 250, 156, "Tax Summary");
  drawLabelValue(doc, "Subtotal", formatCurrency(Number(order.subtotal)), 319, summaryTop + 28);
  drawLabelValue(doc, "Discount", formatCurrency(Number(order.discountAmount)), 319, summaryTop + 56);
  drawLabelValue(doc, "Shipping", formatCurrency(Number(order.shippingAmount)), 319, summaryTop + 84);
  drawLabelValue(doc, `CGST (${(gstRate / 2).toFixed(1)}%)`, formatCurrency(cgst), 319, summaryTop + 112);
  drawLabelValue(doc, `SGST (${(gstRate / 2).toFixed(1)}%)`, formatCurrency(sgst), 435, summaryTop + 112);

  doc.roundedRect(40, summaryTop, 250, 156, 12).fillAndStroke("#f5f8fb", "#d6dee8");
  doc.fillColor("#08111f").font("Helvetica-Bold").fontSize(11).text("Invoice Notes", 54, summaryTop + 14);
  doc.font("Helvetica").fontSize(10).fillColor("#5b6474");
  doc.text("Supply type: Domestic taxable supply", 54, summaryTop + 38);
  doc.text("Currency: INR", 54, summaryTop + 56);
  doc.text(`Payment status: ${order.paymentStatus}`, 54, summaryTop + 74);
  doc.text(`Order status: ${order.status}`, 54, summaryTop + 92);
  doc.text(`GST charged on order: ${gstRate.toFixed(1)}%`, 54, summaryTop + 110);
  if (order.notes) {
    doc.text(`Notes: ${order.notes}`, 54, summaryTop + 128, { width: 210 });
  }

  doc.roundedRect(305, summaryTop + 156, 250, 44, 12).fill("#08111f");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("Grand Total", 319, summaryTop + 170);
  doc.fontSize(16).text(formatCurrency(Number(order.totalAmount)), 445, summaryTop + 168, { width: 90, align: "right" });

  doc.fillColor("#5b6474").font("Helvetica").fontSize(9);
  doc.text(
    `This is a computer-generated GST invoice issued by ${env.COMPANY_LEGAL_NAME}. For support, contact ${env.COMPANY_EMAIL}.`,
    40,
    760,
    {
      width: 515,
      align: "center"
    }
  );
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
};
