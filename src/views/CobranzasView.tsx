import React, { useMemo, useState } from "react";
import { Reservation, FinancialInvoice, B2BClient, DirectClient, PaymentVoucher, CompanyConfig, WithholdingCertificate, WalletTransaction } from "../types";
import type { FlightTicket } from "../types/aereos";
import { TaxJurisdiction } from "../lib/taxEngine";
import CobranzasB2BPanel from "./CobranzasB2BPanel";
import CobranzasDirectosPanel from "./CobranzasDirectosPanel";

interface CobranzasViewProps {
  clients: B2BClient[];
  onUpdateClient: (updated: B2BClient) => void;
  directClients: DirectClient[];
  onUpdateDirectClient: (updated: DirectClient) => void;
  invoices: FinancialInvoice[];
  onUpdateInvoice: (updated: FinancialInvoice) => void;
  reservations: Reservation[];
  boletos?: FlightTicket[];
  onAddInvoice?: (newInv: FinancialInvoice) => void;
  vouchers: PaymentVoucher[];
  onAddVoucher: (newVoucher: PaymentVoucher) => void;
  onUpdateVoucher: (updated: PaymentVoucher) => void;
  companyConfig: CompanyConfig;
  jurisdiction?: TaxJurisdiction;
  withholdingCertificates?: WithholdingCertificate[];
  onAddWithholdingCertificate?: (cert: WithholdingCertificate) => void;
  onDeleteWithholdingCertificate?: (id: string) => void;
  walletTransactions: WalletTransaction[];
  onAddWalletTransaction: (tx: WalletTransaction) => void;
}

export default function CobranzasView({
  clients,
  onUpdateClient,
  directClients,
  onUpdateDirectClient,
  invoices,
  onUpdateInvoice,
  reservations,
  boletos = [],
  onAddInvoice,
  vouchers,
  onAddVoucher,
  onUpdateVoucher,
  companyConfig,
  jurisdiction,
  withholdingCertificates,
  onAddWithholdingCertificate,
  onDeleteWithholdingCertificate,
  walletTransactions,
  onAddWalletTransaction,
}: CobranzasViewProps) {
  const [activeTab, setActiveTab] = useState<"b2b" | "directos">("b2b");

  // Los comprobantes/facturas de clientes directos quedan identificados por clientId (plumbing
  // nueva); todo lo demás (sin clientId, o con uno que no pertenece a un cliente directo) se
  // considera B2B — igual que hoy, donde la ausencia de match nunca cuenta como deuda directa.
  const directIds = useMemo(() => new Set(directClients.map(c => c.id)), [directClients]);
  const b2bInvoices = useMemo(() => invoices.filter(inv => !inv.clientId || !directIds.has(inv.clientId)), [invoices, directIds]);
  const directInvoices = useMemo(() => invoices.filter(inv => inv.clientId && directIds.has(inv.clientId)), [invoices, directIds]);
  const b2bVouchers = useMemo(() => vouchers.filter(v => !directIds.has(v.clientId)), [vouchers, directIds]);
  const directVouchers = useMemo(() => vouchers.filter(v => directIds.has(v.clientId)), [vouchers, directIds]);

  return (
    <div className="space-y-6 font-sans">
      <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("b2b")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "b2b"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          B2B
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("directos")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "directos"
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Directos
        </button>
      </div>

      {activeTab === "b2b" ? (
        <CobranzasB2BPanel
          clients={clients}
          onUpdateClient={onUpdateClient}
          invoices={b2bInvoices}
          onUpdateInvoice={onUpdateInvoice}
          reservations={reservations}
          boletos={boletos}
          onAddInvoice={onAddInvoice}
          vouchers={b2bVouchers}
          onAddVoucher={onAddVoucher}
          onUpdateVoucher={onUpdateVoucher}
          companyConfig={companyConfig}
          jurisdiction={jurisdiction}
          withholdingCertificates={withholdingCertificates}
          onAddWithholdingCertificate={onAddWithholdingCertificate}
          onDeleteWithholdingCertificate={onDeleteWithholdingCertificate}
          walletTransactions={walletTransactions}
          onAddWalletTransaction={onAddWalletTransaction}
        />
      ) : (
        <CobranzasDirectosPanel
          clients={directClients}
          onUpdateClient={onUpdateDirectClient}
          invoices={directInvoices}
          onUpdateInvoice={onUpdateInvoice}
          reservations={reservations}
          boletos={boletos}
          onAddInvoice={onAddInvoice}
          vouchers={directVouchers}
          onAddVoucher={onAddVoucher}
          onUpdateVoucher={onUpdateVoucher}
          companyConfig={companyConfig}
          walletTransactions={walletTransactions}
          onAddWalletTransaction={onAddWalletTransaction}
          withholdingCertificates={withholdingCertificates}
          onAddWithholdingCertificate={onAddWithholdingCertificate}
          onDeleteWithholdingCertificate={onDeleteWithholdingCertificate}
          jurisdiction={jurisdiction}
        />
      )}
    </div>
  );
}
