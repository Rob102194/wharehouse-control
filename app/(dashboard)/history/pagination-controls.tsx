"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
};

export function PaginationControls({ currentPage, totalPages, totalItems, limit }: PaginationControlsProps) {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/history?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm md:flex-row">
      <span className="text-slate-600">
        Mostrando <span className="font-medium text-slate-800">{startItem}-{endItem}</span> de{" "}
        <span className="font-medium text-slate-800">{totalItems}</span> resultados
      </span>

      <div className="flex items-center gap-1">
        {currentPage > 1 && (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="rounded border border-slate-300 px-3 py-1 text-slate-700 transition hover:bg-white"
          >
            ← Anterior
          </Link>
        )}

        <span className="px-2 text-slate-500">
          Página {currentPage} de {totalPages}
        </span>

        {currentPage < totalPages && (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="rounded border border-slate-300 px-3 py-1 text-slate-700 transition hover:bg-white"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}