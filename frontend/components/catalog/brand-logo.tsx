import Image from "next/image";
import { isLocalUploadImage } from "@/lib/images";

type BrandLogoProps = {
  name: string;
  logoUrl?: string | null;
  alt?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

const shouldBypassImageOptimizer = (src: string) => isLocalUploadImage(src) || src.toLowerCase().includes(".svg");

export function BrandLogo({
  name,
  logoUrl,
  alt,
  wrapperClassName = "",
  imageClassName = "",
  fallbackClassName = ""
}: BrandLogoProps) {
  if (!logoUrl) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-center ${wrapperClassName}`}>
        <span className={`font-display text-lg font-semibold text-ink ${fallbackClassName}`}>{name}</span>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${wrapperClassName}`}>
      <Image
        src={logoUrl}
        alt={alt ?? `${name} logo`}
        fill
        sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, 150px"
        className={`object-contain ${imageClassName}`}
        unoptimized={shouldBypassImageOptimizer(logoUrl)}
      />
    </div>
  );
}
