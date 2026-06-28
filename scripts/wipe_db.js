import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { 
  connectorConfig,
  listReservations, deleteReservation,
  listClients, deleteClient,
  listInvoices, deleteInvoice,
  listProperties, deleteDetailedProperty,
  listRoomTypes, deleteRoomType,
  listRatePlans, deleteRatePlan,
  listStopSales, deleteStopSale,
  listFlightTickets, deleteFlightTicket,
  listTransferServices, deleteTransferService,
  listFleetVehicles, deleteFleetVehicle,
  listFleetDrivers, deleteFleetDriver,
  listPayableObligations, deletePayableObligation,
  listProviderStatements, deleteProviderStatement,
  listExtraServices, deleteExtraService,
  listServiceRates, deleteServiceRate
} from "../src/lib/dataconnect/index.cjs.js";

const firebaseConfig = {
  projectId: "foratour-erp-2026",
};

const app = initializeApp(firebaseConfig);
const dataConnect = getDataConnect(app, connectorConfig);

async function wipe() {
  console.log("Fetching all data...");
  const [
    reservationsRes, clientsRes, invoicesRes, propsRes, roomsRes, ratesRes, stopsRes,
    flightsRes, transfersRes, vehiclesRes, driversRes, payablesRes, statementsRes,
    extrasRes, extraRatesRes
  ] = await Promise.all([
    listReservations(dataConnect).catch(() => ({ data: { reservations: [] } })),
    listClients(dataConnect).catch(() => ({ data: { b2BClients: [] } })),
    listInvoices(dataConnect).catch(() => ({ data: { financialInvoices: [] } })),
    listProperties(dataConnect).catch(() => ({ data: { hotelProperties: [] } })),
    listRoomTypes(dataConnect).catch(() => ({ data: { roomTypes: [] } })),
    listRatePlans(dataConnect).catch(() => ({ data: { ratePlans: [] } })),
    listStopSales(dataConnect).catch(() => ({ data: { stopSales: [] } })),
    listFlightTickets(dataConnect).catch(() => ({ data: { flightTickets: [] } })),
    listTransferServices(dataConnect).catch(() => ({ data: { transferServices: [] } })),
    listFleetVehicles(dataConnect).catch(() => ({ data: { fleetVehicles: [] } })),
    listFleetDrivers(dataConnect).catch(() => ({ data: { fleetDrivers: [] } })),
    listPayableObligations(dataConnect).catch(() => ({ data: { payableObligations: [] } })),
    listProviderStatements(dataConnect).catch(() => ({ data: { providerStatements: [] } })),
    listExtraServices(dataConnect).catch(() => ({ data: { extraServices: [] } })),
    listServiceRates(dataConnect).catch(() => ({ data: { serviceRates: [] } }))
  ]);

  console.log("Deleting...");
  for (const r of reservationsRes.data.reservations || []) await deleteReservation(dataConnect, { id: r.id }).catch(e => console.log("Failed", e));
  for (const c of clientsRes.data.b2BClients || []) await deleteClient(dataConnect, { id: c.id }).catch(e => console.log("Failed", e));
  for (const i of invoicesRes.data.financialInvoices || []) await deleteInvoice(dataConnect, { id: i.id }).catch(e => console.log("Failed", e));
  for (const p of propsRes.data.hotelProperties || []) await deleteDetailedProperty(dataConnect, { id: p.id }).catch(e => console.log("Failed", e));
  for (const r of roomsRes.data.roomTypes || []) await deleteRoomType(dataConnect, { id: r.id }).catch(e => console.log("Failed", e));
  for (const r of ratesRes.data.ratePlans || []) await deleteRatePlan(dataConnect, { id: r.id }).catch(e => console.log("Failed", e));
  for (const s of stopsRes.data.stopSales || []) await deleteStopSale(dataConnect, { id: s.id }).catch(e => console.log("Failed", e));
  for (const f of flightsRes.data.flightTickets || []) await deleteFlightTicket(dataConnect, { id: f.id }).catch(e => console.log("Failed", e));
  for (const t of transfersRes.data.transferServices || []) await deleteTransferService(dataConnect, { id: t.id }).catch(e => console.log("Failed", e));
  for (const v of vehiclesRes.data.fleetVehicles || []) await deleteFleetVehicle(dataConnect, { id: v.id }).catch(e => console.log("Failed", e));
  for (const d of driversRes.data.fleetDrivers || []) await deleteFleetDriver(dataConnect, { id: d.id }).catch(e => console.log("Failed", e));
  for (const p of payablesRes.data.payableObligations || []) await deletePayableObligation(dataConnect, { id: p.id }).catch(e => console.log("Failed", e));
  for (const s of statementsRes.data.providerStatements || []) await deleteProviderStatement(dataConnect, { id: s.id }).catch(e => console.log("Failed", e));
  for (const e of extrasRes.data.extraServices || []) await deleteExtraService(dataConnect, { id: e.id }).catch(e => console.log("Failed", e));
  for (const r of extraRatesRes.data.serviceRates || []) await deleteServiceRate(dataConnect, { id: r.id }).catch(e => console.log("Failed", e));

  console.log("WIPE DONE!");
  process.exit(0);
}

wipe().catch(e => {
  console.error(e);
  process.exit(1);
});
