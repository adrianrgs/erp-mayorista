import { ReactNode } from "react";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  title?: string;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

// Chip de estado reutilizable — consolida el patrón `px-2 py-0.5 rounded border text-[9px]
// font-bold uppercase` repetido a mano en decenas de vistas. "success" usa emerald (no green)
// para alinearse con el resto de la paleta semántica de la app.
export default function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
