"use client";

import { useFormStatus } from "react-dom";
import type { OperationActionState } from "@/app/(dashboard)/operations/actions";

type OperationSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
};

export function OperationSubmitButton({ label, pendingLabel, disabled = false }: OperationSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function OperationActionFeedback({ state }: { state: OperationActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}
