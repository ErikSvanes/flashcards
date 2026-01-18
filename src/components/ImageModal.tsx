"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ImageModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export default function ImageModal({
  open,
  onClose,
  imageUrl,
  alt = "Image",
}: ImageModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-full max-h-full object-contain cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
