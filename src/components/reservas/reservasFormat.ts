import { Reservation } from "../../types";

export const getStatusBadge = (status: Reservation["status"]) => {
  switch (status) {
    case "Confirmada":
      return "bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold";
    case "Pendiente":
      return "bg-zinc-100 border-zinc-200 text-zinc-600 font-bold";
    case "Pendiente de Pago":
      return "bg-amber-50 border-amber-250 text-amber-700 font-bold";
    case "Petición Especial":
      return "bg-blue-50 border-blue-200 text-blue-700 font-bold";
    case "Modificada":
      return "bg-purple-50 border-purple-200 text-purple-700 font-bold";
    case "Cancelada":
      return "bg-red-50 border-red-200 text-red-650 font-bold";
    default:
      return "bg-zinc-50 border-zinc-200 text-zinc-700 font-medium";
  }
};

// Format date from yyyy-mm-dd to dd/mm/yyyy
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};
