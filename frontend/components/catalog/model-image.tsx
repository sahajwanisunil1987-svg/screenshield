"use client";

import { ReactNode, useEffect, useState } from "react";

type ModelImageProps = {
  name: string;
  imageUrl?: string | null;
  alt?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallback?: ReactNode;
};

export function ModelImage({
  name,
  imageUrl,
  alt,
  wrapperClassName = "",
  imageClassName = "",
  fallback
}: ModelImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (!imageUrl || hasError) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-center ${wrapperClassName}`}>
        {fallback ?? <span className="text-lg font-semibold text-ink">{name.slice(0, 1)}</span>}
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${wrapperClassName}`}>
      <img
        src={imageUrl}
        alt={alt ?? `${name} image`}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`h-full w-full object-contain ${imageClassName}`}
      />
    </div>
  );
}
