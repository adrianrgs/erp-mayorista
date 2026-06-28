import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix imports
content = content.replace('import type { FlightTicket } from "./types/aereos";', '')
content = content.replace('import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement } from "./types";',
                          'import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher } from "./types";\nimport type { FlightTicket } from "./types/aereos";')
content = content.replace('import { Property, RoomType, RatePlan, StopSale } from "./types/producto";',
                          'import { Property, RoomType, RatePlan, StopSale, ExtraService, ServiceRate } from "./types/producto";')
content = content.replace('import {\n  listReservations, insertReservation, updateReservation,',
                          'import {\n  listReservations, insertReservation, updateReservation, deleteReservation,\n  listDetailedProperties, insertDetailedProperty, updateDetailedProperty, deleteDetailedProperty,\n  listRoomTypes, insertRoomType, updateRoomType, deleteRoomType,\n  listRatePlans, insertRatePlan, updateRatePlan, deleteRatePlan,\n  listStopSales, insertStopSale, updateStopSale, deleteStopSale,\n  listFlightTickets, insertFlightTicket, updateFlightTicket, deleteFlightTicket,\n  listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher,\n  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,\n  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate,')

# Fix VuelosView props
content = re.sub(r'<VuelosView\s+flights=\{sortedFlights\}\s+onBoletosChange=\{setFlights\}\s+clients=\{sortedClients\}\s+/>',
                 '<VuelosView \n                     flights={sortedFlights} \n                     boletos={boletos} \n                     clients={sortedClients} \n                     onAddBoleto={handleAddBoleto}\n                     onUpdateBoleto={handleUpdateBoleto}\n                     onDeleteBoleto={handleDeleteBoleto}\n                   />', content)

# Fix CobranzasView props
content = re.sub(r'<CobranzasView\s*clients=\{sortedClients\}\s*onUpdateClient=\{handleUpdateClient\}\s*invoices=\{sortedInvoices\}\s*onUpdateInvoice=\{handleUpdateInvoice\}\s*reservations=\{sortedReservations\}\s*onAddInvoice=\{handleAddInvoice\}\s*/>',
                 '<CobranzasView \n                    clients={sortedClients} \n                    onUpdateClient={handleUpdateClient} \n                    invoices={sortedInvoices} \n                    onUpdateInvoice={handleUpdateInvoice} \n                    reservations={sortedReservations}\n                    onAddInvoice={handleAddInvoice}\n                    vouchers={vouchers}\n                    onAddVoucher={handleAddVoucher}\n                    onUpdateVoucher={handleUpdateVoucher}\n                  />', content)

# Add handleDeleteReservation if missing
if 'const handleDeleteReservation' not in content:
    content = content.replace('const handleAddReservation', 'const handleDeleteReservation = async (id: string) => { setReservations(prev => prev.filter(r => r.id !== id)); try { await deleteReservation(dataConnect, { id }); } catch (e) {} };\n  const handleAddReservation')

# Fix setCobranzasInitialClient
content = content.replace('setCobranzasInitialClient', '(() => {})')

# Fix handleUpdateTransfer to use OperationalTransfer
content = content.replace('const handleUpdateTransfer = async (updated: TransferService) => {', 'const handleUpdateTransfer = async (updated: OperationalTransfer) => {')
content = content.replace('await updateTransferService(dataConnect, { ...updated });\n      setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));', 'const ts = mapToTransferService(updated); await updateTransferService(dataConnect, ts); setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));')

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")
