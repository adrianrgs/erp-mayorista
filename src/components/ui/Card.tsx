import { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

// Wrapper de tarjeta reutilizable — consolida los divs `bg-white border border-zinc-200
// rounded-lg` repetidos ad hoc por toda la app, con un slot opcional de título/acciones
// en el header (patrón ya usado a mano en varias vistas).
export default function Card({ title, actions, children, className = "", ...props }: CardProps) {
  return (
    <div {...props} className={`bg-white border border-zinc-200 rounded-lg ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          {title && <h3 className="font-black text-xs text-zinc-900 uppercase tracking-widest">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
