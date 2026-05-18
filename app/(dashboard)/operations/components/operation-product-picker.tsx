"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductVariant } from "@/types/product-variant";

type OperationProductPickerProps = {
  variants: ProductVariant[];
  selectedIds: string[];
  onSelect: (variant: ProductVariant) => void;
  onDuplicateAttempt?: () => void;
};

type Suggestion = {
  id: string;
  label: string;
  variant: ProductVariant;
};

export function OperationProductPicker({ variants, selectedIds, onSelect, onDuplicateAttempt }: OperationProductPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const filtered = variants.filter((v) => {
      const inProductName = v.product_name.toLowerCase().includes(normalizedQuery);
      const inVariantName = v.name.toLowerCase().includes(normalizedQuery);
      const inSku = v.sku?.toLowerCase().includes(normalizedQuery);
      return inProductName || inVariantName || !!inSku;
    });

    return filtered
      .map((v) => ({
        id: v.id,
        label: `${v.product_name} - ${v.name}${v.sku ? ` (${v.sku})` : ""}`,
        variant: v,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [query, variants]);

  const availableSuggestions = useMemo(
    () => suggestions.filter((s) => !selectedIds.includes(s.id)),
    [suggestions, selectedIds],
  );

  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      if (selectedIds.includes(suggestion.id)) {
        onDuplicateAttempt?.();
        setQuery("");
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.focus();
        return;
      }

      onSelect(suggestion.variant);
      setQuery("");
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [onSelect, selectedIds, onDuplicateAttempt],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || availableSuggestions.length === 0) {
        if (e.key === "Escape") {
          setIsOpen(false);
          setActiveIndex(-1);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < availableSuggestions.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : availableSuggestions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < availableSuggestions.length) {
            handleSelect(availableSuggestions[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [isOpen, availableSuggestions, activeIndex, handleSelect],
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement | undefined;
      activeItem?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  return (
    <div className="relative">
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Buscar producto o SKU</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe nombre, variante o SKU..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          autoComplete="off"
        />
      </label>

      {isOpen && availableSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {availableSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-2 text-sm transition ${
                index === activeIndex
                  ? "bg-brand-50 text-brand-900"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim() && suggestions.length > 0 && availableSuggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Todas las variantes mostradas ya fueron agregadas.
        </div>
      )}

      {isOpen && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          No se encontraron resultados.
        </div>
      )}
    </div>
  );
}
