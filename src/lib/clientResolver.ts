import { Reservation, B2BClient, DirectClient } from "../types";

export type SaleClientRef =
  | { kind: "B2B"; client: B2BClient }
  | { kind: "Directo"; client: DirectClient }
  | { kind: null; client: null };

// Resuelve el cliente (B2B o Directo) asociado a una venta/expediente, centralizando
// el patrón `clients.find(c => c.nombre === agenciaName)` repetido en ReservasView,
// FacturacionView, App.tsx y el reconciliador financiero.
export function resolveSaleClient(
  res: Pick<Reservation, "canalVenta" | "agenciaName" | "clienteDirectoId">,
  b2bClients: B2BClient[],
  directClients: DirectClient[]
): SaleClientRef {
  if (res.canalVenta === "Directo") {
    const client = directClients.find((c) => c.id === res.clienteDirectoId);
    return client ? { kind: "Directo", client } : { kind: null, client: null };
  }
  const client = b2bClients.find(
    (c) => c.nombre.toLowerCase() === (res.agenciaName || "").toLowerCase()
  );
  return client ? { kind: "B2B", client } : { kind: null, client: null };
}

// ClientType.CREDITO y DirectClientTipo.CREDITO comparten el literal "A Crédito" a propósito
// (ver src/types.ts), lo que permite este único check estructural para ambos tipos de cliente.
export function isCreditEligible(ref: SaleClientRef): boolean {
  return ref.client?.tipo === "A Crédito";
}
