import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# ADD MISSING IMPORTS
missing_imports = """
import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher } from "./types";
import type { FlightTicket } from "./types/aereos";
import { Property, RoomType, RatePlan, StopSale, ExtraService, ServiceRate } from "./types/producto";
import { 
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
  updateInvoice, updateClient,
  listPayableObligations, insertPayableObligation, updatePayableObligation, deletePayableObligation,
  listProviderStatements, insertProviderStatement, deleteProviderStatement,
  listExtraServices, insertExtraService, updateExtraService, deleteExtraService,
  listServiceRates, insertServiceRate, updateServiceRate, deleteServiceRate
} from "@foratour-erp/dataconnect";
"""
content = re.sub(r'import\s*\{\s*ProjectView[\s\S]*?from\s*"@foratour-erp/dataconnect";', missing_imports.strip(), content)

# REMOVE BAD IMPORTS
content = content.replace('import type { FlightTicket } from "./types/aereos";\nimport type { FlightTicket } from "./types/aereos";', 'import type { FlightTicket } from "./types/aereos";')

with open("src/App.tsx", "w") as f:
    f.write(content)
