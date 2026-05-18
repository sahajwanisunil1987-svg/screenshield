import Image from "next/image";
import { ReactNode } from "react";
import { isLocalUploadImage } from "@/lib/images";

type ModelImageProps = {
  name: string;
  imageUrl?: string | null;
  alt?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallback?: ReactNode;
};

const shouldBypassImageOptimizer = (src: string) => isLocalUploadImage(src) || src.toLowerCase().includes(".svg");

export function ModelImage({
  name,
  imageUrl,
  alt,
  wrapperClassName = "",
  imageClassName = "",
  fallback
}: ModelImageProps) {
  if (!imageUrl) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-center ${wrapperClassName}`}>
        {fallback ?? <span className="text-lg font-semibold text-ink">{name.slice(0, 1)}</span>}
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${wrapperClassName}`}>
      <Image
        src={imageUrl}
        alt={alt ?? `${name} image`}
        fill
        sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, 180px"
        className={`object-contain ${imageClassName}`}
        unoptimized={shouldBypassImageOptimizer(imageUrl)}
      />
    </div>
  );
}
