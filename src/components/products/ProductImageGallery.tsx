import type { ProductImageSlot } from "@/features/images/image-storage.types";
import { ProductImagePreview } from "./ProductImagePreview";

interface ProductImageGalleryProps {
  images: ProductImageSlot[];
  disabled: boolean;
  onRemove: (key: string) => void;
  onReplace: (key: string) => void;
  onMakePrimary: (key: string) => void;
}

export function ProductImageGallery({ images, disabled, onRemove, onReplace, onMakePrimary }: ProductImageGalleryProps) {
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image, index) => (
        <ProductImagePreview
          key={image.key}
          image={image}
          index={index}
          isPrimary={index === 0}
          disabled={disabled || image.status === "uploading"}
          onRemove={() => onRemove(image.key)}
          onReplace={() => onReplace(image.key)}
          onMakePrimary={() => onMakePrimary(image.key)}
        />
      ))}
    </div>
  );
}
