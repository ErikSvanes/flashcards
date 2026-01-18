"use client";

import { useLayoutEffect, useRef, useState } from "react";
import DeleteIcon from "@/icons/DeleteIcon";
import MarkdownDisplay from "./MarkdownDisplay";
import ImageModal from "./ImageModal";

export type UpdateButton = {
  onClick: () => void,
  icon: "add" | "delete",
  className: string,
};

interface FlashcardEntryProps {
  term: string;
  definition: string;
  termImage?: string;
  definitionImage?: string;
  isMarkdown?: boolean;
  onChange?: (field: "term" | "definition", value: string) => void;
  onImageUpload?: (field: "term" | "definition", file: File) => void;
  onImageRemove?: (field: "term" | "definition") => void;
  onMarkdownToggle?: (isMarkdown: boolean) => void;
  updateButton?: UpdateButton;
  readonly?: boolean;
  autoFocusField?: "term" | "definition";
  uploadingField?: "term" | "definition";
}

export default function FlashcardEntry({
  term,
  definition,
  termImage,
  definitionImage,
  isMarkdown = false,
  onChange,
  onImageUpload,
  onImageRemove,
  onMarkdownToggle,
  updateButton,
  readonly = false,
  autoFocusField,
  uploadingField,
}: FlashcardEntryProps) {
  const termRef = useRef<HTMLTextAreaElement>(null);
  const defRef = useRef<HTMLTextAreaElement>(null);
  const termImageInputRef = useRef<HTMLInputElement>(null);
  const defImageInputRef = useRef<HTMLInputElement>(null);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  const baseStyle =
    "rounded-4xl px-6 py-4 text-black bg-green-200 shadow-sm focus:outline-none resize-none overflow-hidden";

  const handleImageSelect = (field: "term" | "definition", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(field, file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const renderImageSection = (field: "term" | "definition", imageUrl?: string) => {
    const isUploading = uploadingField === field;
    const inputRef = field === "term" ? termImageInputRef : defImageInputRef;

    return (
      <div className="flex items-center gap-2 mt-1">
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleImageSelect(field, e)}
          className="hidden"
          disabled={readonly || isUploading}
        />

        {imageUrl ? (
          // Image preview with remove button
          <div className="relative group inline-block">
            <img
              src={imageUrl}
              alt={`${field} image`}
              className="max-w-88 max-h-64 object-contain rounded border border-gray-300 cursor-pointer hover:opacity-80 transition"
              onClick={() => setModalImage({ url: imageUrl, alt: `${field} image` })}
            />
            {!readonly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageRemove?.(field);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ) : (
          // Upload button
          !readonly && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Add ${field} image`}
            >
              {isUploading ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </span>
              ) : (
                `+ Image`
              )}
            </button>
          )
        )}
      </div>
    );
  };

  useLayoutEffect(() => {
    const resize = (el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };

    resize(termRef.current);
    resize(defRef.current);

    // Auto-focus the specified field
    if (autoFocusField === "term" && termRef.current) {
      termRef.current.focus();
      const length = termRef.current.value.length;
      termRef.current.setSelectionRange(length, length);
    } else if (autoFocusField === "definition" && defRef.current) {
      defRef.current.focus();
      const length = defRef.current.value.length;
      defRef.current.setSelectionRange(length, length);
    }
  }, [autoFocusField, term, definition, isMarkdown]);

  return (
    <div className="flex gap-2 mb-2 items-start">
      {/* Markdown Checkbox */}
      {!readonly && (
        <div className="flex items-center pt-4">
          <input
            type="checkbox"
            checked={isMarkdown}
            onChange={(e) => onMarkdownToggle?.(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
            title="Enable Markdown"
          />
        </div>
      )}

      {/* Term */}
      <div className="flex-[1] flex flex-col">
        <textarea
          ref={termRef}
          className={`${baseStyle} ${
            readonly ? "pointer-events-none" : ""
          }`}
          value={term}
          onChange={(e) => {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
            onChange?.("term", el.value);
          }}
          placeholder="Term"
          readOnly={readonly}
          rows={1}
        />
        {renderImageSection("term", termImage)}
      </div>

      {/* Definition */}
      <div className="flex flex-[2] gap-2 items-start">
        <div className="flex-1 flex flex-col">
          {isMarkdown ? (
            // Markdown mode: textarea + preview side by side
            <>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col">
                  <textarea
                    ref={defRef}
                    className={`${baseStyle} ${
                      readonly ? "pointer-events-none" : ""
                    }`}
                    value={definition}
                    onChange={(e) => {
                      const el = e.target;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                      onChange?.("definition", el.value);
                    }}
                    placeholder="Definition (Markdown)"
                    readOnly={readonly}
                    rows={1}
                  />
                </div>
                <div className={`${baseStyle} flex-1 pointer-events-none`}>
                  <MarkdownDisplay content={definition} />
                </div>
              </div>
              {renderImageSection("definition", definitionImage)}
            </>
          ) : (
            // Plain text mode: just textarea
            <>
              <textarea
                ref={defRef}
                className={`${baseStyle} ${
                  readonly ? "pointer-events-none" : ""
                }`}
                value={definition}
                onChange={(e) => {
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                  onChange?.("definition", el.value);
                }}
                placeholder="Definition"
                readOnly={readonly}
                rows={1}
              />
              {renderImageSection("definition", definitionImage)}
            </>
          )}
        </div>

        {!readonly && updateButton && (
          <button
            onClick={updateButton.onClick}
            className={`group ${updateButton.className}`}
            title="Delete Card"
          >
            {updateButton.icon === "delete" && (
              <DeleteIcon className="w-5 h-5 text-red-500 group-hover:text-white"/>
            )}
          </button>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        open={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage?.url || ""}
        alt={modalImage?.alt}
      />
    </div>
  );
}
