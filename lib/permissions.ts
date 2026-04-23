import type { Role } from "@/types/domain";

export function isAdmin(role: Role): boolean {
  return role === "admin";
}

export function isOperator(role: Role): boolean {
  return role === "operator";
}

export function isOwner(role: Role): boolean {
  return role === "owner";
}

export function canCreateAdjustment(role: Role): boolean {
  return isAdmin(role);
}

export function canConfirmTransferReceipt(role: Role): boolean {
  return isAdmin(role) || isOperator(role);
}

export function canAccessOperations(role: Role): boolean {
  return isAdmin(role) || isOperator(role);
}

export function canAccessAdmin(role: Role): boolean {
  return isAdmin(role);
}

export function canAccessStock(role: Role): boolean {
  return isAdmin(role) || isOperator(role) || isOwner(role);
}

export function canAccessHistory(role: Role): boolean {
  return isAdmin(role) || isOperator(role) || isOwner(role);
}
