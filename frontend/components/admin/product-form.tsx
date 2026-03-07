"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Brand, Category, MobileModel } from "@/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const schema = z.object({
  name: z.string().min(3),
  sku: z.string().min(3),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  warrantyMonths: z.coerce.number().min(0),
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  categoryId: z.string().min(1),
  stock: z.coerce.number().min(0),
  imageUrl: z.string().url()
});

type FormValues = z.infer<typeof schema>;

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<MobileModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      warrantyMonths: 6,
      stock: 0
    }
  });

  const brandId = watch("brandId");

  useEffect(() => {
    Promise.all([api.get("/brands"), api.get("/models"), api.get("/categories")])
      .then(([b, m, c]) => {
        setBrands(b.data);
        setModels(m.data);
        setCategories(c.data);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product form data"));
      });
  }, []);

  useEffect(() => {
    if (!productId) return;
    api.get("/products?limit=100")
      .then((response) => {
        const product = response.data.items.find((item: any) => item.id === productId);
        if (!product) return;
        setValue("name", product.name);
        setValue("sku", product.sku);
        setValue("shortDescription", product.shortDescription);
        setValue("description", product.description);
        setValue("price", product.price);
        setValue("comparePrice", product.comparePrice ?? undefined);
        setValue("warrantyMonths", product.warrantyMonths);
        setValue("brandId", product.brand.id);
        setValue("modelId", product.model.id);
        setValue("categoryId", product.category.id);
        setValue("stock", product.inventory?.stock ?? product.stock);
        setValue("imageUrl", product.images[0]?.url ?? "");
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product"));
      });
  }, [productId, setValue]);

  const filteredModels = models.filter((model) => !brandId || model.brandId === brandId);

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const payload = {
          name: values.name,
          sku: values.sku,
          shortDescription: values.shortDescription,
          description: values.description,
          specifications: {
            quality: "Premium",
            warranty: `${values.warrantyMonths} Months`
          },
          price: values.price,
          comparePrice: values.comparePrice,
          warrantyMonths: values.warrantyMonths,
          brandId: values.brandId,
          modelId: values.modelId,
          categoryId: values.categoryId,
          stock: values.stock,
          isFeatured: true,
          isActive: true,
          images: [{ url: values.imageUrl, alt: values.name }]
        };

        try {
          const request = productId
            ? api.put(`/admin/products/${productId}`, payload, authHeaders(token))
            : api.post("/admin/products", payload, authHeaders(token));

          await request;
          toast.success(`Product ${productId ? "updated" : "created"}`);
          router.push("/admin/products");
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Unable to save product"));
        }
      })}
      className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 md:grid-cols-2"
    >
      <Input placeholder="Product name" {...register("name")} />
      <Input placeholder="SKU" {...register("sku")} />
      <Input placeholder="Short description" {...register("shortDescription")} />
      <Input placeholder="Description" {...register("description")} />
      <Input placeholder="Price" type="number" {...register("price")} />
      <Input placeholder="Compare price" type="number" {...register("comparePrice")} />
      <Input placeholder="Warranty months" type="number" {...register("warrantyMonths")} />
      <Input placeholder="Stock" type="number" {...register("stock")} />
      <select {...register("brandId")} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
        <option value="">Select brand</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>{brand.name}</option>
        ))}
      </select>
      <select {...register("modelId")} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
        <option value="">Select model</option>
        {filteredModels.map((model) => (
          <option key={model.id} value={model.id}>{model.name}</option>
        ))}
      </select>
      <select {...register("categoryId")} className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <Input placeholder="Primary image URL" {...register("imageUrl")} />
      <div className="md:col-span-2">
        <Button>Save product</Button>
      </div>
    </form>
  );
}
