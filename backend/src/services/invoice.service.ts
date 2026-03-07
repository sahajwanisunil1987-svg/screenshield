import PDFDocument from "pdfkit";
import { prisma } from "../lib/prisma.js";

export const generateInvoicePdfBuffer = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
      invoice: true
    }
  });

  if (!order || !order.invoice) {
    throw new Error("Invoice not found");
  }

  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk as Buffer));

  doc.fontSize(20).text("SpareKart GST Invoice");
  doc.moveDown();
  doc.fontSize(12).text(`Invoice No: ${order.invoice.invoiceNumber}`);
  doc.text(`Order No: ${order.orderNumber}`);
  doc.text(`Customer: ${order.user.name}`);
  doc.text(`Email: ${order.user.email}`);
  doc.text(`Total: INR ${Number(order.totalAmount).toFixed(2)}`);
  doc.moveDown();
  order.items.forEach((item) => {
    doc.text(`${item.productName} x ${item.quantity} - INR ${Number(item.totalPrice).toFixed(2)}`);
  });
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
};
