import re

with open("src/App.tsx", "r") as f:
    content = f.read()

import_str = """
import { dataConnect } from "./lib/firebase";
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

content = re.sub(r'import \{ dataConnect \} from "\./lib/firebase";[\s\S]*?from "@foratour-erp/dataconnect";', import_str.strip(), content)

# Remove duplicates of import { ProjectView
content = re.sub(r'import \{ ProjectView[\s\S]*?from "\./types";', 'import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, OperationalTransfer, mapToOperationalTransfer, mapToTransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement, PaymentVoucher } from "./types";', content, 1)

with open("src/App.tsx", "w") as f:
    f.write(content)
