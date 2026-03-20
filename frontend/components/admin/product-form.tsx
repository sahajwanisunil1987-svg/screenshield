"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Brand, Category, MobileModel, Product } from "@/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const DEFAULT_SPECIFICATIONS = "quality: Premium\nwarranty: 6 Months";
const URL_REGEX = /^https?:\/\//i;

type ProductFormValues = {
  name: string;
  sku: string;
  hsnCode: string;
  gstRate: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  warrantyMonths: string;
  brandId: string;
  modelId: string;
  compatibleModelIds: string[];
  categoryId: string;
  stock: string;
  lowStockLimit: string;
  warehouseCode: string;
  imageUrls: string;
  videoUrl: string;
  specificationsText: string;
  isFeatured: boolean;
  isActive: boolean;
};

type ProductFormErrors = Partial<Record<Exclude<keyof ProductFormValues, "compatibleModelIds" | "isFeatured" | "isActive">, string>>;

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  sku: "",
  hsnCode: "",
  gstRate: "18",
  shortDescription: "",
  description: "",
  price: "",
  comparePrice: "",
  warrantyMonths: "6",
  brandId: "",
  modelId: "",
  compatibleModelIds: [],
  categoryId: "",
  stock: "0",
  lowStockLimit: "5",
  warehouseCode: "",
  imageUrls: "",
  videoUrl: "",
  specificationsText: DEFAULT_SPECIFICATIONS,
  isFeatured: false,
  isActive: true
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<MobileModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredModels = useMemo(
    () => models.filter((model) => !form.brandId || model.brandId === form.brandId),
    [form.brandId, models]
  );
  const imagePreviewUrls = useMemo(
    () =>
      form.imageUrls
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.imageUrls]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    Promise.all([
      api.get<Brand[]>("/brands", authHeaders(token)),
      api.get<MobileModel[]>("/models", authHeaders(token)),
      api.get<Category[]>("/categories", authHeaders(token))
    ])
      .then(([brandResponse, modelResponse, categoryResponse]) => {
        setBrands(brandResponse.data);
        setModels(modelResponse.data);
        setCategories(categoryResponse.data);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product form data"));
      });
  }, [token]);

  useEffect(() => {
    if (!productId || !token) {
      return;
    }

    api.get<Product>(`/admin/products/${productId}`, authHeaders(token))
      .then((response) => {
        const product = response.data;
        if (!product) {
          return;
        }

        setForm({
          name: product.name,
          sku: product.sku,
          hsnCode: product.hsnCode ?? "",
          gstRate: String(Number(product.gstRate ?? 18)),
          shortDescription: product.shortDescription,
          description: product.description,
          price: String(product.price),
          comparePrice: product.comparePrice ? String(product.comparePrice) : "",
          warrantyMonths: String(product.warrantyMonths),
          brandId: product.brand.id,
          modelId: product.model.id,
          compatibleModelIds: (product.compatibilityModels ?? []).map((entry) => entry.model.id),
          categoryId: product.category.id,
          stock: String(product.inventory?.stock ?? product.stock),
          lowStockLimit: String(product.inventory?.lowStockLimit ?? 5),
          warehouseCode: product.inventory?.warehouseCode ?? "",
          imageUrls: product.images.map((image) => image.url).join("\n"),
          videoUrl: product.videoUrl ?? "",
          specificationsText: Object.entries(product.specifications ?? {})
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n"),
          isFeatured: Boolean(product.isFeatured),
          isActive: Boolean(product.isActive)
        });
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load product"));
      });
  }, [productId, token]);

  useEffect(() => {
    if (!form.brandId) {
      return;
    }

    const allowedIds = new Set(filteredModels.map((model) => model.id));
    const nextCompatibleModels = form.compatibleModelIds.filter((modelId) => allowedIds.has(modelId));

    if (nextCompatibleModels.length !== form.compatibleModelIds.length) {
      setForm((current) => ({ ...current, compatibleModelIds: nextCompatibleModels }));
    }
  }, [filteredModels, form.brandId, form.compatibleModelIds]);

  useEffect(() => {
    if (!form.modelId || form.compatibleModelIds.includes(form.modelId)) {
      return;
    }

    setForm((current) => ({
      ...current,
      compatibleModelIds: Array.from(new Set([...current.compatibleModelIds, current.modelId]))
    }));
  }, [form.compatibleModelIds, form.modelId]);

  const updateField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in errors && errors[key as keyof ProductFormErrors]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: ProductFormErrors = {};
    const comparePrice = form.comparePrice.trim() ? Number(form.comparePrice) : undefined;
    const gstRate = Number(form.gstRate);
    const price = Number(form.price);
    const warrantyMonths = Number(form.warrantyMonths);
    const stock = Number(form.stock);
    const lowStockLimit = Number(form.lowStockLimit);

    if (form.name.trim().length < 3) nextErrors.name = "Product name must be at least 3 characters";
    if (form.sku.trim().length < 3) nextErrors.sku = "SKU must be at least 3 characters";
    if (form.hsnCode.trim().length > 20) nextErrors.hsnCode = "HSN code must be 20 characters or less";
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) nextErrors.gstRate = "GST rate must be between 0 and 100";
    if (form.shortDescription.trim().length < 10) nextErrors.shortDescription = "Short description must be at least 10 characters";
    if (form.description.trim().length < 20) nextErrors.description = "Description must be at least 20 characters";
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = "Price must be greater than 0";
    if (comparePrice !== undefined && (!Number.isFinite(comparePrice) || comparePrice <= 0)) nextErrors.comparePrice = "Compare price must be greater than 0";
    if (!Number.isFinite(warrantyMonths) || warrantyMonths < 0) nextErrors.warrantyMonths = "Warranty months must be 0 or more";
    if (!form.brandId) nextErrors.brandId = "Select a brand";
    if (!form.modelId) nextErrors.modelId = "Select a model";
    if (!form.categoryId) nextErrors.categoryId = "Select a category";
    if (!Number.isFinite(stock) || stock < 0) nextErrors.stock = "Stock must be 0 or more";
    if (!Number.isFinite(lowStockLimit) || lowStockLimit < 0 || lowStockLimit > 999) nextErrors.lowStockLimit = "Low stock alert must be between 0 and 999";
    if (form.imageUrls.trim().length < 5) nextErrors.imageUrls = "Add at least one image URL";
    if (form.videoUrl.trim() && !URL_REGEX.test(form.videoUrl.trim())) nextErrors.videoUrl = "Video URL must start with http:// or https://";
    if (form.specificationsText.trim().length < 3) nextErrors.specificationsText = "Add at least one specification";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

      setForm((current) => {
        const existing = current.imageUrls
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        return {
          ...current,
          imageUrls: [...uploadedUrls, ...existing].join("\n")
        };
      });
      setErrors((current) => ({ ...current, imageUrls: undefined }));
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload image"));
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVideo = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!token) {
      toast.error("Please login again before uploading");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/admin/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setForm((current) => ({ ...current, videoUrl: response.data.url }));
      setErrors((current) => ({ ...current, videoUrl: undefined }));
      toast.success("Product video uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload video"));
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const specifications = Object.fromEntries(
        form.specificationsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [key, ...rest] = line.split(":");
            return [key.trim(), rest.join(":").trim() || "N/A"];
          })
      );
      const images = form.imageUrls
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((url, index) => ({
          url,
          alt: `${form.name.trim()} image ${index + 1}`
        }));

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        hsnCode: form.hsnCode.trim() || undefined,
        gstRate: Number(form.gstRate),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        specifications,
        price: Number(form.price),
        comparePrice: form.comparePrice.trim() ? Number(form.comparePrice) : undefined,
        warrantyMonths: Number(form.warrantyMonths),
        brandId: form.brandId,
        modelId: form.modelId,
        compatibleModelIds: Array.from(new Set([form.modelId, ...form.compatibleModelIds])),
        categoryId: form.categoryId,
        stock: Number(form.stock),
        lowStockLimit: Number(form.lowStockLimit),
        warehouseCode: form.warehouseCode.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        images
      };

      const request = productId
        ? api.put(`/admin/products/${productId}`, payload, authHeaders(token))
        : api.post("/admin/products", payload, authHeaders(token));

      await request;
      toast.success(`Product ${productId ? "updated" : "created"}`);
      router.push("/admin/products");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save product"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 md:grid-cols-2">
      <div>
        <Input placeholder="Product name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        {errors.name ? <p className="mt-2 text-sm text-rose-200">{errors.name}</p> : null}
      </div>
      <div>
        <Input placeholder="SKU" value={form.sku} onChange={(event) => updateField("sku", event.target.value)} />
        {errors.sku ? <p className="mt-2 text-sm text-rose-200">{errors.sku}</p> : null}
      </div>
      <div>
        <Input placeholder="HSN code" value={form.hsnCode} onChange={(event) => updateField("hsnCode", event.target.value)} />
        {errors.hsnCode ? <p className="mt-2 text-sm text-rose-200">{errors.hsnCode}</p> : null}
      </div>
      <div>
        <Input placeholder="GST rate (%)" type="number" step="0.01" value={form.gstRate} onChange={(event) => updateField("gstRate", event.target.value)} />
        {errors.gstRate ? <p className="mt-2 text-sm text-rose-200">{errors.gstRate}</p> : null}
      </div>
      <div>
        <Input placeholder="Short description" value={form.shortDescription} onChange={(event) => updateField("shortDescription", event.target.value)} />
        {errors.shortDescription ? <p className="mt-2 text-sm text-rose-200">{errors.shortDescription}</p> : null}
      </div>
      <div>
        <Input placeholder="Description" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        {errors.description ? <p className="mt-2 text-sm text-rose-200">{errors.description}</p> : null}
      </div>
      <div>
        <Input placeholder="Price" type="number" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
        {errors.price ? <p className="mt-2 text-sm text-rose-200">{errors.price}</p> : null}
      </div>
      <div>
        <Input placeholder="Compare price" type="number" value={form.comparePrice} onChange={(event) => updateField("comparePrice", event.target.value)} />
        {errors.comparePrice ? <p className="mt-2 text-sm text-rose-200">{errors.comparePrice}</p> : null}
      </div>
      <div>
        <Input placeholder="Warranty months" type="number" value={form.warrantyMonths} onChange={(event) => updateField("warrantyMonths", event.target.value)} />
        {errors.warrantyMonths ? <p className="mt-2 text-sm text-rose-200">{errors.warrantyMonths}</p> : null}
      </div>
      <div>
        <Input placeholder="Stock" type="number" value={form.stock} onChange={(event) => updateField("stock", event.target.value)} />
        {errors.stock ? <p className="mt-2 text-sm text-rose-200">{errors.stock}</p> : null}
      </div>
      <div>
        <Input placeholder="Low stock alert" type="number" value={form.lowStockLimit} onChange={(event) => updateField("lowStockLimit", event.target.value)} />
        {errors.lowStockLimit ? <p className="mt-2 text-sm text-rose-200">{errors.lowStockLimit}</p> : null}
      </div>
      <Input placeholder="Warehouse code" value={form.warehouseCode} onChange={(event) => updateField("warehouseCode", event.target.value)} />
      <div>
        <select value={form.brandId} onChange={(event) => updateField("brandId", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          <option value="">Select brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        {errors.brandId ? <p className="mt-2 text-sm text-rose-200">{errors.brandId}</p> : null}
      </div>
      <div>
        <select value={form.modelId} onChange={(event) => updateField("modelId", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          <option value="">Select model</option>
          {filteredModels.map((model) => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
        {errors.modelId ? <p className="mt-2 text-sm text-rose-200">{errors.modelId}</p> : null}
      </div>
      <div>
        <select value={form.categoryId} onChange={(event) => updateField("categoryId", event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {errors.categoryId ? <p className="mt-2 text-sm text-rose-200">{errors.categoryId}</p> : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white md:col-span-2">
        <p className="font-semibold text-white">Compatible models</p>
        <p className="mt-1 text-xs text-white/60">Choose every phone model this part supports. The primary model will be added automatically when you save.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredModels.map((model) => {
            const checked = form.compatibleModelIds.includes(model.id);

            return (
              <label key={model.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...form.compatibleModelIds, model.id]
                      : form.compatibleModelIds.filter((value) => value !== model.id);

                    updateField("compatibleModelIds", Array.from(new Set(nextValues)));
                  }}
                />
                <span>{model.name}</span>
              </label>
            );
          })}
        </div>
        {!filteredModels.length ? <p className="mt-3 text-xs text-white/45">Select a brand first to load compatible models.</p> : null}
      </div>
      <div className="md:col-span-2">
        <textarea
          placeholder="Specifications as key: value, one per line"
          value={form.specificationsText}
          onChange={(event) => updateField("specificationsText", event.target.value)}
          className="min-h-36 w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink"
        />
        {errors.specificationsText ? <p className="mt-2 text-sm text-rose-200">{errors.specificationsText}</p> : null}
      </div>
      <div className="md:col-span-2">
        <textarea
          placeholder="Image URLs, one per line"
          value={form.imageUrls}
          onChange={(event) => updateField("imageUrls", event.target.value)}
          className="min-h-36 w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink"
        />
        {errors.imageUrls ? <p className="mt-2 text-sm text-rose-200">{errors.imageUrls}</p> : null}
      </div>
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 md:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Upload product images</p>
            <p className="mt-1 text-xs text-white/60">Add 1 primary image and up to 6 support images. Fresh uploads go first.</p>
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
                    <Image src={url} alt={`Uploaded preview ${index + 1}`} fill className="object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Primary</span>
                    ) : null}
                  </div>
                  <p className="truncate px-3 py-2 text-[11px] text-white/55">Image {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <Input placeholder="Optional product video URL" value={form.videoUrl} onChange={(event) => updateField("videoUrl", event.target.value)} className="md:col-span-2" />
        {errors.videoUrl ? <p className="mt-2 text-sm text-rose-200">{errors.videoUrl}</p> : null}
      </div>
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 md:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Upload product video</p>
            <p className="mt-1 text-xs text-white/60">Optional 1 short video for fitment or quality demo.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-accentSoft">
            {isUploading ? "Uploading..." : "Choose Video"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                void uploadVideo(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {form.videoUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <video src={form.videoUrl} controls className="aspect-video w-full bg-black" preload="metadata" />
          </div>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-white md:col-span-1">
        <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField("isFeatured", event.target.checked)} />
        Featured product
      </label>
      <label className="flex items-center gap-2 text-sm text-white md:col-span-1">
        <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />
        Active product
      </label>
      <div className="md:col-span-2">
        <Button disabled={isSaving || isUploading}>{isSaving ? "Saving..." : "Save product"}</Button>
      </div>
    </form>
  );
}
