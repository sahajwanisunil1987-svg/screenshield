"use client";

import { useState } from "react";

type BrandLogoProps = {
  name: string;
  logoUrl?: string | null;
  alt?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function BrandLogo({
  name,
  logoUrl,
  alt,
  wrapperClassName = "",
  imageClassName = "",
  fallbackClassName = ""
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-center ${wrapperClassName}`}>
        <span className={`font-display text-lg font-semibold text-ink ${fallbackClassName}`}>{name}</span>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${wrapperClassName}`}>
      <img
        src={logoUrl}
        alt={alt ?? `${name} logo`}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`max-h-full max-w-full object-contain ${imageClassName}`}
      />
    </div>
  );
}
