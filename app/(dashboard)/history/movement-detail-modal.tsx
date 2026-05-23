"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { editMovementWithCompensationAction, deleteMovementWithCompensationAction, type EditActionState } from "./actions";
import { Modal } from "@/app/(dashboard)/components/modal";
import type { MovementHistoryRow, EditableMovementItem } from "@/types/movement";
import type { Warehouse } from "@/types/warehouse";
import type { ProductVariant } from "@/types/product-variant";

type MovementDetailModalProps = {
  movement: MovementHistoryRow | null;
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
};

const initialState: EditActionState = {
  ok: false,
  message: "",
};

const MOVEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  entry: { label: "Compra", icon: "📦" },
  exit: { label: "Despacho", icon: "🚀" },
  transfer: { label: "Transferencia", icon: "↔️" },
  adjustment: { label: "Ajuste", icon: "✏️" },
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MovementDetailModal({ movement, isOpen, onClose, warehouses }: MovementDetailModalProps) {
  const [state, formAction, isPending] = useActionState(editMovementWithCompensationAction, initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editReason, setEditReason] = useState("");

  const [localOrigin, setLocalOrigin] = useState<string>("");
  const [localDest, setLocalDest] = useState<string>("");
  const [localNotes, setLocalNotes] = useState<string>("");
  const [localAdjReason, setLocalAdjReason] = useState<string>("");
  const [localItems, setLocalItems] = useState<EditableMovementItem[]>([]);
  const [adjDirection, setAdjDirection] = useState<"positive" | "negative">("positive");

  const [searchTerm, setSearchTerm] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [foundVariants, setFoundVariants] = useState<ProductVariant[]>([]);
  const [newItemQty, setNewItemQty] = useState("1");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteState, deleteFormAction] = useActionState(deleteMovementWithCompensationAction, initialState);

  useEffect(() => {
    if (movement) {
      setLocalOrigin(movement.origin_warehouse_id ?? "");
      setLocalDest(movement.destination_warehouse_id ?? "");
      setLocalNotes(movement.notes ?? "");
      setLocalAdjReason(movement.adjustment_reason ?? "");
      setAdjDirection((movement.adjustment_direction as "positive" | "negative") || "positive");
      setLocalItems(
        movement.items.map((item) => ({
          ...item,
          _status: "existing",
        }))
      );
      setIsEditing(false);
      setEditReason("");
    }
  }, [movement]);

  useEffect(() => {
    if (state.ok) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  }, [state.ok, onClose]);

  useEffect(() => {
    if (deleteState.ok) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  }, [deleteState.ok, onClose]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const params = new URLSearchParams();
          params.set("search", searchTerm);
          const response = await fetch(`/api/product-variants?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setFoundVariants(data.variants?.slice(0, 10) ?? []);
          }
        } catch (e) {
          console.error("Search error:", e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFoundVariants([]);
    }
  }, [searchTerm]);

  if (!movement) return null;

  const typeInfo = MOVEMENT_LABELS[movement.movement_type] || { label: movement.movement_type, icon: "❓" };
  const originWarehouse = warehouses.find((w) => w.id === localOrigin);
  const destWarehouse = warehouses.find((w) => w.id === localDest);

  const removeItem = (index: number) => {
    setLocalItems((prev) => {
      const newItems = [...prev];
      if (newItems[index]._status === "existing") {
        newItems[index]._status = "deleted";
      } else {
        newItems.splice(index, 1);
      }
      return newItems;
    });
  };

  const addItem = (variant: ProductVariant) => {
    const exists = localItems.some(
      (i) => i.product_variant_id === variant.id && i._status !== "deleted"
    );
    if (exists) {
      alert("El producto ya existe en el movimiento");
      return;
    }
    const qty = parseFloat(newItemQty) || 1;
    setLocalItems((prev) => [
      ...prev,
      {
        product_variant_id: variant.id,
        product_variant_name: variant.name,
        sku: variant.sku,
        quantity: qty,
        _status: "added",
      },
    ]);
    setShowPicker(false);
    setSearchTerm("");
    setNewItemQty("1");
  };

  const activeItems = localItems.filter((i) => i._status !== "deleted");
  const hasChanges =
    localOrigin !== (movement.origin_warehouse_id ?? "") ||
    localDest !== (movement.destination_warehouse_id ?? "") ||
    localNotes !== (movement.notes ?? "") ||
    localItems.some((i) => i._status !== "existing") ||
    (movement.movement_type === "adjustment" && localAdjReason !== (movement.adjustment_reason ?? ""));

  const handleSubmit = (formData: FormData) => {
    formData.set("movement_id", movement.id);
    formData.set("origin_warehouse_id", localOrigin);
    formData.set("destination_warehouse_id", localDest || "");
    formData.set("notes", localNotes);
    formData.set("adjustment_reason", localAdjReason);
    formData.set("edit_reason", editReason);
    formData.set("adjustment_direction", adjDirection);
    formData.set("items_json", JSON.stringify(activeItems.map((i) => ({
      product_variant_id: i.product_variant_id,
      quantity: i.quantity,
    }))));
    formAction(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del movimiento" size="lg">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {movement.status}
          </span>
          {movement.is_incident && (
            <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              ⚠️ Incidencia
            </span>
          )}
          {movement.edit_count > 0 && (
            <span className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
              ✏️ Editado ({movement.edit_count})
            </span>
          )}
          {movement.status === "in_transit" && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              🚚 En tránsito
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Fecha:</span>
            <p className="font-medium text-slate-800">{formatDate(movement.created_at)}</p>
          </div>
          <div>
            <span className="text-slate-500">Actor:</span>
            <p className="font-medium text-slate-800">{movement.actor_name}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase text-slate-500">Almacenes</span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-brand-700 hover:underline"
            >
              {isEditing ? "Cancelar" : "✏️ Editar"}
            </button>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Origen</label>
                <select
                  value={localOrigin}
                  onChange={(e) => setLocalOrigin(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="">Seleccionar</option>
                  {warehouses.filter((w) => w.active).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              {movement.movement_type === "transfer" && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Destino</label>
                  <select
                    value={localDest}
                    onChange={(e) => setLocalDest(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {warehouses
                      .filter((w) => w.active && w.id !== localOrigin)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {originWarehouse && (
                <div>
                  <span className="text-slate-500">Origen:</span>
                  <p className="font-medium text-slate-800">{originWarehouse.code} - {originWarehouse.name}</p>
                </div>
              )}
              {destWarehouse && movement.movement_type === "transfer" && (
                <div>
                  <span className="text-slate-500">Destino:</span>
                  <p className="font-medium text-slate-800">{destWarehouse.code} - {destWarehouse.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
            <span className="text-xs font-medium uppercase text-slate-500">
              Productos ({activeItems.length})
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="text-xs text-brand-700 hover:underline"
              >
                + Agregar
              </button>
            )}
          </div>

          {showPicker && isEditing && (
            <div className="p-3 border-b border-slate-200 bg-amber-50">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm mb-2"
              />
              {foundVariants.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {foundVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => addItem(v)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100"
                    >
                      {v.name} {v.sku && `(${v.sku})`}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  step="0.001"
                  min="0.001"
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Cantidad"
                />
                <span className="text-xs text-slate-500">Cantidad</span>
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-t border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-3 py-1">Producto</th>
                  <th className="px-3 py-1">SKU</th>
                  <th className="px-3 py-1 text-right">Cantidad</th>
                  {isEditing && <th className="px-3 py-1 w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {localItems
                  .filter((i) => i._status !== "deleted")
                  .map((item, idx) => (
                    <tr key={`${item.product_variant_id}-${idx}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-sm text-slate-800">{item.product_variant_name}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{item.sku ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLocalItems((prev) =>
                                prev.map((i, iIdx) =>
                                  iIdx === idx ? { ...i, quantity: val } : i
                                )
                              );
                            }}
                            step="0.001"
                            min="0.001"
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm text-right"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">
                            {Number(item.quantity).toFixed(3)}
                          </span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {isEditing && movement.movement_type === "adjustment" && (
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="block text-xs text-slate-500 mb-1">Dirección del ajuste</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjDirection("positive")}
                className={`px-3 py-1 rounded text-sm ${
                  adjDirection === "positive"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                + Positivo
              </button>
              <button
                type="button"
                onClick={() => setAdjDirection("negative")}
                className={`px-3 py-1 rounded text-sm ${
                  adjDirection === "negative"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                - Negativo
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-3">
          <label className="block text-xs text-slate-500 mb-1">Notas</label>
          {isEditing ? (
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Notas..."
            />
          ) : (
            <p className="text-sm text-slate-700">{movement.notes || "-"}</p>
          )}
        </div>

        {isEditing && movement.movement_type === "adjustment" && (
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="block text-xs text-slate-500 mb-1">Razón del ajuste</label>
            <textarea
              value={localAdjReason}
              onChange={(e) => setLocalAdjReason(e.target.value)}
              rows={2}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Razón del ajuste..."
            />
          </div>
        )}

        {isEditing && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <label className="block text-xs font-medium text-red-700 mb-1">
              Razón de edición (obligatorio)
            </label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={2}
              required
              className="w-full rounded border border-red-300 px-2 py-1 text-sm"
              placeholder="Explica por qué se edita este movimiento..."
            />
          </div>
        )}

        {state.message && (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>
            {state.message}
          </p>
        )}

        {isEditing ? (
          <form action={handleSubmit} className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <SubmitButton />
          </form>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Editar movimiento
              </button>
            </div>
            <div className="flex justify-center border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                🗑️ Eliminar operación
              </button>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-4 shadow-xl">
              <h3 className="text-lg font-semibold text-red-700">Confirmar eliminación</h3>
              <p className="mt-2 text-sm text-slate-600">
                Esta acción no se puede deshacer. Se creará un movimiento compensatorio para ajustar el stock.
                El movimiento original permanecerá en el historial marcado como eliminado.
              </p>
              <form
                action={(formData) => {
                  formData.set("movement_id", movement.id);
                  formData.set("delete_reason", deleteReason);
                  deleteFormAction(formData);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Razón de eliminación (obligatorio)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                    required
                    placeholder="Explica por qué se elimina esta operación..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                {deleteState.message && (
                  <p className={`text-sm ${deleteState.ok ? "text-emerald-700" : "text-red-600"}`}>
                    {deleteState.message}
                  </p>
                )}
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteReason("");
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!deleteReason.trim() || deleteReason.trim().length < 3}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirmar eliminación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}