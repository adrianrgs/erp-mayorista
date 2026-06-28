import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix FlightTicket updatedAt
content = re.sub(r'newBol\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)
content = re.sub(r'updated\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)

# Fix vouchers updatedAt
content = re.sub(r'newVoucher\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)
content = re.sub(r'updated\.updatedAt = new Date\(\)\.toISOString\(\);\n\s*', '', content)

# Add missing imports manually
import_statement = """import { 
  listReservations, insertReservation, updateReservation, deleteReservation,
  listClients, insertClient, 
  listInvoices, insertInvoice,
  listDetailedProperties, insertDetailedProperty, updateDetailedProperty, deleteDetailedProperty,
  listRoomTypes, insertRoomType, updateRoomType, deleteRoomType,
  listRatePlans, insertRatePlan, updateRatePlan, deleteRatePlan,
  listStopSales, insertStopSale, updateStopSale, deleteStopSale,
  listFlightTickets, insertFlightTicket, updateFlightTicket, deleteFlightTicket,
  listTransferServices, insertTransferService, updateTransferService, deleteTransferService,
  listFleetVehicles, insertFleetVehicle, updateFleetVehicle, deleteFleetVehicle,
  listFleetDrivers, insertFleetDriver, updateFleetDriver, deleteFleetDriver,
  listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher,
  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,
  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate,
  updateInvoice, updateClient,
  listPayableObligations, insertPayableObligation, updatePayableObligation, deletePayableObligation,
  listProviderStatements, insertProviderStatement, deleteProviderStatement
} from "@foratour-erp/dataconnect";
import { dataConnect } from "./lib/firebase";"""

content = re.sub(r'import\s+\{\s*initialProperties[\s\S]*?from\s*"./mockData";', import_statement + '\n\nimport { \n  initialProperties, \n  initialReservas, \n  initialFlights, \n  initialTransfers, \n  initialInvoices,\n  initialClients,\n  initialDetailedProperties,\n  initialRoomTypes,\n  initialRatePlans,\n  initialStopSales,\n  initialFleetVehicles,\n  initialFleetDrivers,\n  initialPayableObligations,\n  initialProviderStatements\n} from "./mockData";', content)

# Fix OperationalTransfer mismatch in handleUpdateTransfer
content = content.replace("const handleUpdateTransfer = async (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")
content = content.replace("await updateTransferService(dataConnect, { ...updated });\n      setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));", "const ts = mapToTransferService(updated); await updateTransferService(dataConnect, ts); setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));")

# Fix setCobranzasInitialClient
content = content.replace("setCobranzasInitialClient={(() => {})}", "setCobranzasInitialClient={(client) => {}}")

with open("src/App.tsx", "w") as f:
    f.write(content)
