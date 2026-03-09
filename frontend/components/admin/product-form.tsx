"use client";

import Image from "next/image";
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
  compatibleModelIds: z.array(z.string()).default([]),
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
      compatibleModelIds: [],
      isFeatured: false,
      isActive: true,
      specificationsText: "quality: Premium\nwarranty: 6 Months",
      imageUrls: ""
    }
  });

  const brandId = watch("brandId");
  const modelId = watch("modelId");
  const imageUrls = watch("imageUrls");
  const compatibleModelIds = watch("compatibleModelIds");
  const imagePreviewUrls = imageUrls
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      api.get("/brands", authHeaders(token)),
      api.get("/models", authHeaders(token)),
      api.get("/categories", authHeaders(token))
    ])
      .then(([b, m, c]) => {
        setBrands(b.data);
        setModels(m.data);
        setCategories(c.data);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product form data"));
      });
  }, [token]);

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
        setValue(
          "compatibleModelIds",
          (product.compatibilityModels ?? []).map((entry: { model: { id: string } }) => entry.model.id)
        );
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

  useEffect(() => {
    if (!brandId) return;

    const allowedIds = new Set(filteredModels.map((model) => model.id));
    const nextCompatibleModels = compatibleModelIds.filter((modelId) => allowedIds.has(modelId));

    if (nextCompatibleModels.length !== compatibleModelIds.length) {
      setValue("compatibleModelIds", nextCompatibleModels, { shouldValidate: true });
    }
  }, [brandId, compatibleModelIds, filteredModels, setValue]);

  useEffect(() => {
    if (!modelId || compatibleModelIds.includes(modelId)) {
      return;
    }

    setValue("compatibleModelIds", Array.from(new Set([...compatibleModelIds, modelId])), { shouldValidate: true });
  }, [compatibleModelIds, modelId, setValue]);

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

      // Put fresh uploads first so public surfaces pick the latest image as primary.
      setValue("imageUrls", [...uploadedUrls, ...existing].join("\n"), { shouldValidate: true });
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
          compatibleModelIds: Array.from(new Set([values.modelId, ...values.compatibleModelIds])),
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white md:col-span-2">
        <p className="font-semibold text-white">Compatible models</p>
        <p className="mt-1 text-xs text-white/60">
          Choose every phone model this part supports. The primary model will be added automatically when you save.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredModels.map((model) => {
            const checked = compatibleModelIds.includes(model.id);

            return (
              <label key={model.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...compatibleModelIds, model.id]
                      : compatibleModelIds.filter((value) => value !== model.id);

                    setValue("compatibleModelIds", Array.from(new Set(nextValues)), { shouldValidate: true });
                  }}
                />
                <span>{model.name}</span>
              </label>
            );
          })}
        </div>
        {!filteredModels.length ? (
          <p className="mt-3 text-xs text-white/45">Select a brand first to load compatible models.</p>
        ) : null}
      </div>
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
            <p className="mt-1 text-xs text-white/60">Files Cloudinary par upload hongi aur URLs automatically add ho jayengi.</p>
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
        {imagePreviewUrls.length ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-white/60">{imagePreviewUrls.length} image URL(s) ready</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="relative aspect-square">
                    <Image
                      src={url}
                      alt={`Uploaded preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="truncate px-3 py-2 text-[11px] text-white/55">Image {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
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
