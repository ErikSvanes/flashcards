// src/components/ContextMenu.tsx
"use client";

import { useEffect, useRef } from "react";

export interface MenuOption {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: MenuOption[];
}

export default function ContextMenu({
  x,
  y,
  onClose,
  options,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > window.innerWidth) {
        adjustedX = window.innerWidth - rect.width - 10;
      }
      if (rect.bottom > window.innerHeight) {
        adjustedY = window.innerHeight - rect.height - 10;
      }

      menu.style.left = `${Math.max(10, adjustedX)}px`;
      menu.style.top = `${Math.max(10, adjustedY)}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded shadow-lg border border-gray-200 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
            option.variant === "danger"
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
