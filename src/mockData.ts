import { 
  HotelProperty, 
  Reservation, 
  FlightLeg, 
  TransferService, 
  FinancialInvoice,
  B2BClient,
  FleetVehicle,
  FleetDriver,
  PayableObligation,
  ProviderStatement
} from "./types";
import { Property, RoomType, RatePlan, StopSale } from "./types/producto";

export const initialProperties: HotelProperty[] = [];
export const initialReservas: Reservation[] = [];
export const initialFlights: FlightLeg[] = [];
export const initialTransfers: TransferService[] = [];
export const initialInvoices: FinancialInvoice[] = [];
export const initialClients: B2BClient[] = [];
export const initialDetailedProperties: Property[] = [];
export const initialRoomTypes: RoomType[] = [];
export const initialRatePlans: RatePlan[] = [];
export const initialStopSales: StopSale[] = [];
export const initialFleetVehicles: FleetVehicle[] = [];
export const initialFleetDrivers: FleetDriver[] = [];
export const initialPayableObligations: PayableObligation[] = [];
export const initialProviderStatements: ProviderStatement[] = [];
