/**
 * Shim de compatibilidad: replica la firma del SDK de Data Connect
 * pero llama al backend NestJS via REST.
 * El parámetro _dc (dataConnect instance) se ignora — ya no es necesario.
 */
import { axiosInstance as api } from "./api";

// ─── QUERIES ──────────────────────────────────────────────────────────────────

export const listReservations = async (_dc?: any) => {
  const r = await api.get("/reservations");
  return { data: { reservations: r.data } };
};

export const listClients = async (_dc?: any) => {
  const r = await api.get("/clients");
  return { data: { b2BClients: r.data } };
};

export const listInvoices = async (_dc?: any) => {
  const r = await api.get("/finances/invoices");
  return { data: { financialInvoices: r.data } };
};

export const listDetailedProperties = async (_dc?: any) => {
  const r = await api.get("/properties");
  return { data: { detailedProperties: r.data.detailed ?? [] } };
};

export const listRoomTypes = async (_dc?: any) => {
  const r = await api.get("/properties/room-types");
  return { data: { roomTypes: r.data } };
};

export const listRatePlans = async (_dc?: any) => {
  const r = await api.get("/properties/rate-plans");
  return { data: { ratePlans: r.data } };
};

export const listStopSales = async (_dc?: any) => {
  const r = await api.get("/properties/stop-sales");
  return { data: { stopSales: r.data } };
};

export const listFlightTickets = async (_dc?: any) => {
  const r = await api.get("/flights/tickets");
  return { data: { flightTickets: r.data } };
};

export const listTransferServices = async (_dc?: any) => {
  const r = await api.get("/transfers");
  return { data: { transferServices: r.data } };
};

export const listFleetVehicles = async (_dc?: any) => {
  const r = await api.get("/operations/vehicles");
  return { data: { fleetVehicles: r.data } };
};

export const listFleetDrivers = async (_dc?: any) => {
  const r = await api.get("/operations/drivers");
  return { data: { fleetDrivers: r.data } };
};

export const listPaymentVouchers = async (_dc?: any) => {
  const r = await api.get("/finances/vouchers");
  return { data: { paymentVouchers: r.data } };
};

export const listExtraServices = async (_dc?: any) => {
  const r = await api.get("/services");
  return { data: { extraServices: r.data.services ?? [] } };
};

export const listServiceRates = async (_dc?: any) => {
  const r = await api.get("/services");
  return { data: { serviceRates: r.data.rates ?? [] } };
};

export const listPayableObligations = async (_dc?: any) => {
  const r = await api.get("/finances/obligations");
  return { data: { payableObligations: r.data } };
};

export const listProviderStatements = async (_dc?: any) => {
  const r = await api.get("/finances/statements");
  return { data: { providerStatements: r.data } };
};

// ─── MUTATIONS: RESERVATIONS ─────────────────────────────────────────────────

export const insertReservation = async (_dc: any, vars: any) => {
  await api.post("/reservations", vars);
  return { data: {} };
};

export const updateReservation = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/reservations/${id}`, rest);
  return { data: {} };
};

export const deleteReservation = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/reservations/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: CLIENTS ───────────────────────────────────────────────────────

export const insertClient = async (_dc: any, vars: any) => {
  await api.post("/clients", vars);
  return { data: {} };
};

export const updateClient = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/clients/${id}`, rest);
  return { data: {} };
};

// ─── MUTATIONS: INVOICES ──────────────────────────────────────────────────────

export const insertInvoice = async (_dc: any, vars: any) => {
  await api.post("/finances/invoices", vars);
  return { data: {} };
};

export const updateInvoice = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/finances/invoices/${id}`, rest);
  return { data: {} };
};

// ─── MUTATIONS: PROPERTIES ────────────────────────────────────────────────────

export const insertDetailedProperty = async (_dc: any, vars: any) => {
  await api.post("/properties", vars);
  return { data: {} };
};

export const updateDetailedProperty = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/properties/${id}`, rest);
  return { data: {} };
};

export const deleteDetailedProperty = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/properties/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: ROOM TYPES ────────────────────────────────────────────────────

export const insertRoomType = async (_dc: any, vars: any) => {
  await api.post("/properties/room-types", vars);
  return { data: {} };
};

export const updateRoomType = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/properties/room-types/${id}`, rest);
  return { data: {} };
};

export const deleteRoomType = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/properties/room-types/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: RATE PLANS ────────────────────────────────────────────────────

export const insertRatePlan = async (_dc: any, vars: any) => {
  await api.post("/properties/rate-plans", vars);
  return { data: {} };
};

export const updateRatePlan = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/properties/rate-plans/${id}`, rest);
  return { data: {} };
};

export const deleteRatePlan = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/properties/rate-plans/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: STOP SALES ────────────────────────────────────────────────────

export const insertStopSale = async (_dc: any, vars: any) => {
  await api.post("/properties/stop-sales", vars);
  return { data: {} };
};

export const updateStopSale = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/properties/stop-sales/${id}`, rest);
  return { data: {} };
};

export const deleteStopSale = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/properties/stop-sales/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: FLIGHT TICKETS ────────────────────────────────────────────────

export const insertFlightTicket = async (_dc: any, vars: any) => {
  await api.post("/flights/tickets", vars);
  return { data: {} };
};

export const updateFlightTicket = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/flights/tickets/${id}`, rest);
  return { data: {} };
};

export const deleteFlightTicket = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/flights/tickets/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: TRANSFERS ─────────────────────────────────────────────────────

export const insertTransferService = async (_dc: any, vars: any) => {
  await api.post("/transfers", vars);
  return { data: {} };
};

export const updateTransferService = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/transfers/${id}`, rest);
  return { data: {} };
};

export const deleteTransferService = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/transfers/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: FLEET VEHICLES ────────────────────────────────────────────────

export const insertFleetVehicle = async (_dc: any, vars: any) => {
  await api.post("/operations/vehicles", vars);
  return { data: {} };
};

export const updateFleetVehicle = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/operations/vehicles/${id}`, rest);
  return { data: {} };
};

export const deleteFleetVehicle = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/operations/vehicles/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: FLEET DRIVERS ─────────────────────────────────────────────────

export const insertFleetDriver = async (_dc: any, vars: any) => {
  await api.post("/operations/drivers", vars);
  return { data: {} };
};

export const updateFleetDriver = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/operations/drivers/${id}`, rest);
  return { data: {} };
};

export const deleteFleetDriver = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/operations/drivers/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: PAYMENT VOUCHERS ──────────────────────────────────────────────

export const insertPaymentVoucher = async (_dc: any, vars: any) => {
  await api.post("/finances/vouchers", vars);
  return { data: {} };
};

export const updatePaymentVoucher = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/finances/vouchers/${id}`, rest);
  return { data: {} };
};

// ─── MUTATIONS: EXTRA SERVICES ────────────────────────────────────────────────

export const insertExtraService = async (_dc: any, vars: any) => {
  await api.post("/services", vars);
  return { data: {} };
};

export const updateExtraService = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/services/${id}`, rest);
  return { data: {} };
};

export const deleteExtraService = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/services/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: SERVICE RATES ─────────────────────────────────────────────────

export const insertServiceRate = async (_dc: any, vars: any) => {
  await api.post("/services/rates", vars);
  return { data: {} };
};

export const updateServiceRate = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/services/rates/${id}`, rest);
  return { data: {} };
};

export const deleteServiceRate = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/services/rates/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: PAYABLE OBLIGATIONS ──────────────────────────────────────────

export const insertPayableObligation = async (_dc: any, vars: any) => {
  await api.post("/finances/obligations", vars);
  return { data: {} };
};

export const updatePayableObligation = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/finances/obligations/${id}`, rest);
  return { data: {} };
};

export const deletePayableObligation = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/finances/obligations/${vars.id}`);
  return { data: {} };
};

// ─── MUTATIONS: PROVIDER STATEMENTS ──────────────────────────────────────────

export const insertProviderStatement = async (_dc: any, vars: any) => {
  await api.post("/finances/statements", vars);
  return { data: {} };
};

export const deleteProviderStatement = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/finances/statements/${vars.id}`);
  return { data: {} };
};

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────

export const listProveedores = async (_dc?: any) => {
  const r = await api.get("/proveedores");
  return { data: { proveedores: r.data } };
};

export const insertProveedor = async (_dc: any, vars: any) => {
  await api.post("/proveedores", vars);
  return { data: {} };
};

export const updateProveedor = async (_dc: any, vars: any) => {
  const { id, ...rest } = vars;
  await api.patch(`/proveedores/${id}`, rest);
  return { data: {} };
};

export const deleteProveedor = async (_dc: any, vars: { id: string }) => {
  await api.delete(`/proveedores/${vars.id}`);
  return { data: {} };
};
