import React, { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning" | "success" | "info" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

// Nota: este proyecto no tiene @types/react instalado, así que no hay tipos utilitarios
// nativos (ButtonHTMLAttributes, etc.) disponibles — se declaran los props a mano, siguiendo
// el mismo patrón ya usado en el resto de src/components/ui/.
interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  id?: string;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 hover:bg-zinc-800 text-white",
  secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-amber-600 hover:bg-amber-700 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  info: "bg-blue-600 hover:bg-blue-700 text-white",
  ghost: "bg-transparent hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

// Botón base reutilizable: fija la escala de tamaño/padding y las 4 variantes semánticas de
// color que hoy están reimplementadas a mano con clases ligeramente distintas en cada vista.
export default function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
