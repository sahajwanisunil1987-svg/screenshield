import bcrypt from "bcryptjs";
import { CouponType, PrismaClient, UserRole } from "@prisma/client";
import { toSlug } from "../src/utils/helpers.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.mobileModel.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const brands = await Promise.all(
    ["Samsung", "Apple", "Vivo", "Oppo", "Xiaomi", "Realme", "OnePlus"].map((name) =>
      prisma.brand.create({
        data: {
          name,
          slug: toSlug(name),
          description: `${name} spare parts catalog`
        }
      })
    )
  );

  const vivo = brands.find((brand) => brand.name === "Vivo")!;
  const samsung = brands.find((brand) => brand.name === "Samsung")!;
  const apple = brands.find((brand) => brand.name === "Apple")!;

  const models = await Promise.all([
    { name: "Vivo Y21", brandId: vivo.id },
    { name: "Vivo V29", brandId: vivo.id },
    { name: "Samsung Galaxy A14", brandId: samsung.id },
    { name: "iPhone 13", brandId: apple.id }
  ].map((item) =>
    prisma.mobileModel.create({
      data: {
        ...item,
        slug: toSlug(item.name)
      }
    })
  ));

  const categories = await Promise.all(
    [
      "LCD Display",
      "Touch Screen",
      "Battery",
      "Charging Port",
      "Back Panel",
      "Camera",
      "Speaker",
      "Microphone"
    ].map((name) =>
      prisma.category.create({
        data: {
          name,
          slug: toSlug(name),
          description: `${name} replacement parts`
        }
      })
    )
  );

  const battery = categories.find((category) => category.name === "Battery")!;
  const display = categories.find((category) => category.name === "LCD Display")!;
  const charging = categories.find((category) => category.name === "Charging Port")!;
  const vivoY21 = models.find((model) => model.name === "Vivo Y21")!;
  const iphone13 = models.find((model) => model.name === "iPhone 13")!;
  const galaxyA14 = models.find((model) => model.name === "Samsung Galaxy A14")!;

  const products = [
    {
      name: "Vivo Y21 AMOLED Display Combo",
      sku: "VIVO-Y21-DISP-001",
      shortDescription: "High-brightness AMOLED display assembly for Vivo Y21.",
      description:
        "Premium replacement display combo with tested touch response, frame alignment, and color calibration for Vivo Y21 repair jobs.",
      specifications: {
        type: "AMOLED",
        size: "6.51 inch",
        warranty: "6 Months"
      },
      price: 2599,
      comparePrice: 3199,
      warrantyMonths: 6,
      brandId: vivo.id,
      modelId: vivoY21.id,
      categoryId: display.id,
      stock: 16,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "Vivo Y21 OEM Battery",
      sku: "VIVO-Y21-BATT-001",
      shortDescription: "Original-capacity lithium battery with stable backup.",
      description:
        "Tested replacement battery engineered for safe charging cycles, standby efficiency, and reliable power output on Vivo Y21.",
      specifications: {
        capacity: "5000 mAh",
        chemistry: "Li-ion",
        warranty: "6 Months"
      },
      price: 1199,
      comparePrice: 1499,
      warrantyMonths: 6,
      brandId: vivo.id,
      modelId: vivoY21.id,
      categoryId: battery.id,
      stock: 24,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "Samsung Galaxy A14 Charging Port Flex",
      sku: "SAM-A14-PORT-001",
      shortDescription: "Fast-charge compatible charging port board replacement.",
      description:
        "Precision-fit charging flex module for Samsung Galaxy A14 with tested power intake and data sync support.",
      specifications: {
        connector: "USB-C",
        quality: "OEM Grade",
        warranty: "6 Months"
      },
      price: 799,
      comparePrice: 999,
      warrantyMonths: 6,
      brandId: samsung.id,
      modelId: galaxyA14.id,
      categoryId: charging.id,
      stock: 31,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "iPhone 13 Premium Battery",
      sku: "IPH13-BATT-001",
      shortDescription: "High-efficiency battery replacement for iPhone 13.",
      description:
        "Premium iPhone 13 battery cell with controlled heat profile and strong cycle retention for workshop-grade repairs.",
      specifications: {
        capacity: "3227 mAh",
        quality: "Premium",
        warranty: "6 Months"
      },
      price: 3299,
      comparePrice: 3899,
      warrantyMonths: 6,
      brandId: apple.id,
      modelId: iphone13.id,
      categoryId: battery.id,
      stock: 11,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=900&q=80"
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: toSlug(`${product.name}-${product.sku}`),
        sku: product.sku,
        shortDescription: product.shortDescription,
        description: product.description,
        specifications: product.specifications,
        price: product.price,
        comparePrice: product.comparePrice,
        warrantyMonths: product.warrantyMonths,
        brandId: product.brandId,
        modelId: product.modelId,
        categoryId: product.categoryId,
        stock: product.stock,
        isFeatured: product.isFeatured,
        images: {
          create: [
            {
              url: product.image,
              alt: product.name,
              sortOrder: 0
            }
          ]
        },
        inventory: {
          create: {
            stock: product.stock,
            lowStockLimit: 5
          }
        }
      }
    });
  }

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const customerPasswordHash = await bcrypt.hash("User@1234", 10);

  await prisma.user.create({
    data: {
      name: "SpareKart Admin",
      email: "admin@sparekart.in",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      phone: "9999999999"
    }
  });

  await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "user@sparekart.in",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      phone: "9876543210",
      addresses: {
        create: {
          fullName: "Rahul Sharma",
          line1: "12 MG Road",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          phone: "9876543210",
          isDefault: true
        }
      }
    }
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        type: CouponType.PERCENTAGE,
        value: 10,
        minOrderValue: 999,
        maxDiscount: 300,
        usageLimit: 100
      },
      {
        code: "SAVE200",
        type: CouponType.FLAT,
        value: 200,
        minOrderValue: 1999,
        usageLimit: 50
      }
    ]
  });
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
