import React, { useState } from "react";
import { B2BClient, DirectClient, FinancialInvoice, Reservation } from "../types";
import { FlightTicket } from "../types/aereos";
import { RoomType, RatePlan, Property } from "../types/producto";
import { Tabs } from "../components/reservas/Tabs";
import ClientesB2BPanel from "./ClientesB2BPanel";
import ClientesDirectosPanel from "./ClientesDirectosPanel";

interface ClientesViewProps {
  clients: B2BClient[];
  onUpdateClient: (updated: B2BClient) => void;
  onAddClient: (newClient: B2BClient) => void;
  directClients: DirectClient[];
  onUpdateDirectClient: (updated: DirectClient) => void;
  onAddDirectClient: (newClient: DirectClient) => void;
  invoices: FinancialInvoice[];
  reservations: Reservation[];
  boletos?: FlightTicket[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
  onNavigateToCobranzas?: (clientId: string) => void;
}

export default function ClientesView({
  clients,
  onUpdateClient,
  onAddClient,
  directClients,
  onUpdateDirectClient,
  onAddDirectClient,
  invoices,
  reservations,
  boletos = [],
  roomTypes,
  ratePlans,
  detailedProperties,
  onNavigateToCobranzas
}: ClientesViewProps) {
  const [activeTab, setActiveTab] = useState<"b2b" | "directos">("b2b");

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Módulo de Clientes — Ventas &amp; Cuentas por Cobrar</h2>
        <p className="text-xs text-zinc-400 mt-1">Gestión integral de agencias B2B y clientes directos: crédito, saldos y cartera de cobro.</p>
      </div>

      <Tabs
        tabs={[
          { key: "b2b", label: "Clientes B2B" },
          { key: "directos", label: "Clientes Directos" }
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as "b2b" | "directos")}
      />

      {activeTab === "b2b" ? (
        <ClientesB2BPanel
          clients={clients}
          onUpdateClient={onUpdateClient}
          onAddClient={onAddClient}
          invoices={invoices}
          reservations={reservations}
          boletos={boletos}
          roomTypes={roomTypes}
          ratePlans={ratePlans}
          detailedProperties={detailedProperties}
          onNavigateToCobranzas={onNavigateToCobranzas}
        />
      ) : (
        <ClientesDirectosPanel
          clients={directClients}
          onUpdateClient={onUpdateDirectClient}
          onAddClient={onAddDirectClient}
          invoices={invoices}
          reservations={reservations}
          boletos={boletos}
          roomTypes={roomTypes}
          ratePlans={ratePlans}
          detailedProperties={detailedProperties}
          onNavigateToCobranzas={onNavigateToCobranzas}
        />
      )}
    </div>
  );
}
