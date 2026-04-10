type CatalogHrefOptions = {
  categorySlug?: string | null;
  brand?: string | null;
  model?: string | null;
  search?: string | null;
  sort?: string | null;
  page?: string | number | null;
};

const appendParam = (params: URLSearchParams, key: string, value?: string | number | null) => {
  if (value === undefined || value === null) {
    return;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return;
  }

  params.set(key, normalized);
};

export const buildCatalogHref = ({
  categorySlug,
  brand,
  model,
  search,
  sort,
  page
}: CatalogHrefOptions) => {
  const params = new URLSearchParams();
  appendParam(params, "brand", brand);
  appendParam(params, "model", model);
  appendParam(params, "search", search);
  appendParam(params, "sort", sort);
  appendParam(params, "page", page);

  const query = params.toString();
  if (categorySlug) {
    return `/category/${categorySlug}${query ? `?${query}` : ""}`;
  }

  return `/products${query ? `?${query}` : ""}`;
};
