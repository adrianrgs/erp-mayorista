import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# VuelosView
content = re.sub(r'<VuelosView[^>]+>',
                 '<VuelosView\n                    flights={sortedFlights}\n                    boletos={boletos}\n                    onAddBoleto={handleAddBoleto}\n                    onUpdateBoleto={handleUpdateBoleto}\n                    onDeleteBoleto={handleDeleteBoleto}\n                    clients={sortedClients}\n                  />', content)

# CobranzasView
content = re.sub(r'<CobranzasView[^>]+>',
                 '<CobranzasView\n                    clients={sortedClients}\n                    onUpdateClient={handleUpdateClient}\n                    invoices={sortedInvoices}\n                    onUpdateInvoice={handleUpdateInvoice}\n                    reservations={sortedReservations}\n                    onAddInvoice={handleAddInvoice}\n                    vouchers={vouchers}\n                    onAddVoucher={handleAddVoucher}\n                    onUpdateVoucher={handleUpdateVoucher}\n                  />', content)

# Imports for data connect
import_block = """import {
  listReservations, insertReservation, updateReservation, deleteReservation,
  listClients, insertClient,
  listInvoices, insertInvoice,
  listDetailedProperties, insertDetailedProperty, updateDetailedProperty, deleteDetailedProperty,
  listRoomTypes, insertRoomType, updateRoomType, deleteRoomType,
  listRatePlans, insertRatePlan, updateRatePlan, deleteRatePlan,
  listStopSales, insertStopSale, updateStopSale, deleteStopSale,
  listFlightTickets, insertFlightTicket, updateFlightTicket, deleteFlightTicket,
  listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher,
  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,
  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate,
  listTransferServices, insertTransferService, updateTransferService, deleteTransferService,
  listFleetVehicles, insertFleetVehicle, updateFleetVehicle, deleteFleetVehicle,
  listFleetDrivers, insertFleetDriver, updateFleetDriver, deleteFleetDriver,
  updateInvoice, updateClient,
  listPayableObligations, insertPayableObligation, updatePayableObligation, deletePayableObligation,
  listProviderStatements, insertProviderStatement, deleteProviderStatement
} from "@foratour-erp/dataconnect";"""

content = re.sub(r'import\s+\{[^}]*\}\s+from\s+"@foratour-erp/dataconnect";', import_block, content)

with open("src/App.tsx", "w") as f:
    f.write(content)
