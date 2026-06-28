import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Make sure imports are added!
content = content.replace(
    'import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement } from "./types";',
    'import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher } from "./types";'
)
content = content.replace(
    'import { Property, RoomType, RatePlan, StopSale } from "./types/producto";',
    'import { Property, RoomType, RatePlan, StopSale, ExtraService, ServiceRate } from "./types/producto";'
)

# And fix handleUpdateTransfer once more
content = content.replace("const handleUpdateTransfer = async (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")
content = content.replace("await updateTransferService(dataConnect, { ...updated });\n      setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));", "const ts = mapToTransferService(updated); await updateTransferService(dataConnect, ts); setTransfers(prev => prev.map(t => t.id === updated.id ? ts : t));")

with open("src/App.tsx", "w") as f:
    f.write(content)
