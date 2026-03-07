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
  lowStockLimit: z.coerce.number().min(0).max(999),
  warehouseCode: z.string().optional(),
  imageUrls: z.string().min(5),
  specificationsText: z.string().min(3),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type FormValues = z.infer<typeof schema>;

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<MobileModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      warrantyMonths: 6,
      stock: 0,
      lowStockLimit: 5,
      isFeatured: false,
      isActive: true,
      specificationsText: "quality: Premium\nwarranty: 6 Months",
      imageUrls: ""
    }
  });

  const brandId = watch("brandId");
  const imageUrls = watch("imageUrls");

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
    api.get(`/admin/products/${productId}`, authHeaders(token))
      .then((response) => {
        const product = response.data;
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
        setValue("lowStockLimit", product.inventory?.lowStockLimit ?? 5);
        setValue("warehouseCode", product.inventory?.warehouseCode ?? "");
        setValue("isFeatured", Boolean(product.isFeatured));
        setValue("isActive", Boolean(product.isActive));
        setValue(
          "specificationsText",
          Object.entries(product.specifications ?? {})
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        );
        setValue(
          "imageUrls",
          product.images.map((image: { url: string }) => image.url).join("\n")
        );
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product"));
      });
  }, [productId, setValue]);

  const filteredModels = models.filter((model) => !brandId || model.brandId === brandId);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    if (!token) {
      toast.error("Please login again before uploading");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/admin/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });

        uploadedUrls.push(response.data.url);
      }

      const existing = getValues("imageUrls")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      setValue("imageUrls", [...existing, ...uploadedUrls].join("\n"), { shouldValidate: true });
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload image"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const specifications = Object.fromEntries(
          values.specificationsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [key, ...rest] = line.split(":");
              return [key.trim(), rest.join(":").trim() || "N/A"];
            })
        );
        const images = values.imageUrls
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((url, index) => ({
            url,
            alt: `${values.name} image ${index + 1}`
          }));

        const payload = {
          name: values.name,
          sku: values.sku,
          shortDescription: values.shortDescription,
          description: values.description,
          specifications,
          price: values.price,
          comparePrice: values.comparePrice,
          warrantyMonths: values.warrantyMonths,
          brandId: values.brandId,
          modelId: values.modelId,
          categoryId: values.categoryId,
          stock: values.stock,
          lowStockLimit: values.lowStockLimit,
          warehouseCode: values.warehouseCode,
          isFeatured: values.isFeatured,
          isActive: values.isActive,
          images
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
      <Input placeholder="Low stock alert" type="number" {...register("lowStockLimit")} />
      <Input placeholder="Warehouse code" {...register("warehouseCode")} />
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
      <textarea
        placeholder="Specifications as key: value, one per line"
        {...register("specificationsText")}
        className="min-h-36 rounded-2xl bg-white px-4 py-3 text-sm text-ink md:col-span-2"
      />
      <textarea
        placeholder="Image URLs, one per line"
        {...register("imageUrls")}
        className="min-h-36 rounded-2xl bg-white px-4 py-3 text-sm text-ink md:col-span-2"
      />
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 md:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Upload product images</p>
            <p className="mt-1 text-xs text-white/60">Files AWS S3 par upload hongi aur URLs automatically add ho jayengi.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-accentSoft">
            {isUploading ? "Uploading..." : "Choose Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                void uploadImages(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {imageUrls ? (
          <p className="mt-3 text-xs text-white/60">
            {imageUrls
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean).length} image URL(s) ready
          </p>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-white md:col-span-1">
        <input type="checkbox" {...register("isFeatured")} />
        Featured product
      </label>
      <label className="flex items-center gap-2 text-sm text-white md:col-span-1">
        <input type="checkbox" {...register("isActive")} />
        Active product
      </label>
      <div className="md:col-span-2">
        <Button>Save product</Button>
      </div>
    </form>
  );
}
