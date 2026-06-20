import React from "react";

export default function IndexPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-[#0b1c30]">
        Bienvenido al ERP de Foratour (Fase 0)
      </h2>
      <p className="text-[#565e74] max-w-2xl">
        Esta es la Fase 0 del ERP modular de Foratour. El esqueleto y la arquitectura
        de navegación están configurados para operar sin recargas de página.
        Utiliza el menú de la izquierda para explorar los departamentos y prepararlos para la Fase 1.
      </p>
    </div>
  );
}
