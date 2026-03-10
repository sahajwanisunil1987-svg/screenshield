import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.RESET_CONFIRM !== "DELETE_ALL_SPAREKART_DATA") {
    throw new Error("Set RESET_CONFIRM=DELETE_ALL_SPAREKART_DATA to run this cleanup script.");
  }

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productCompatibility.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.mobileModel.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = process.env.RESET_ADMIN_EMAIL;
  const adminPassword = process.env.RESET_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        name: process.env.RESET_ADMIN_NAME || "Admin",
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        phone: process.env.RESET_ADMIN_PHONE || null,
        emailVerified: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
