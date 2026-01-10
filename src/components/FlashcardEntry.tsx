"use client";

import { useLayoutEffect, useRef } from "react";
import DeleteIcon from "@/icons/DeleteIcon";
import MarkdownDisplay from "./MarkdownDisplay";

export type UpdateButton = {
  onClick: () => void,
  icon: "add" | "delete",
  className: string,
};

interface FlashcardEntryProps {
  term: string;
  definition: string;
  isMarkdown?: boolean;
  onChange?: (field: "term" | "definition", value: string) => void;
  onMarkdownToggle?: (isMarkdown: boolean) => void;
  updateButton?: UpdateButton;
  readonly?: boolean;
  autoFocusField?: "term" | "definition";
}

export default function FlashcardEntry({
  term,
  definition,
  isMarkdown = false,
  onChange,
  onMarkdownToggle,
  updateButton,
  readonly = false,
  autoFocusField,
}: FlashcardEntryProps) {
  const termRef = useRef<HTMLTextAreaElement>(null);
  const defRef = useRef<HTMLTextAreaElement>(null);

  const baseStyle =
    "rounded-4xl px-6 py-4 text-black bg-green-200 shadow-sm focus:outline-none resize-none overflow-hidden";

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
      <textarea
        ref={termRef}
        className={`${baseStyle} flex-[1] ${
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

      {/* Definition */}
      <div className="flex flex-[2] gap-2 items-start">
        {isMarkdown ? (
          // Markdown mode: textarea + preview side by side
          <>
            <textarea
              ref={defRef}
              className={`${baseStyle} flex-1 ${
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
            <div className={`${baseStyle} flex-1 pointer-events-none`}>
              <MarkdownDisplay content={definition} />
            </div>
          </>
        ) : (
          // Plain text mode: just textarea
          <textarea
            ref={defRef}
            className={`${baseStyle} flex-1 ${
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
        )}

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
    </div>
  );
}
