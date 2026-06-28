import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. ADD MISSING STATE VARIABLES
state_insert = """
  const [boletos, setBoletos] = useState<FlightTicket[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>([]);
"""
content = re.sub(r'(const \[payableObligations, setPayableObligations\] = useState<PayableObligation\[\]>\(\[\]\);)', r'\1' + state_insert, content)

# 2. ADD MISSING DATA FETCHING
fetch_insert = """
        const ticketsRes = await listFlightTickets(dataConnect);
        setBoletos(ticketsRes.data.flightTickets);
        const vouchersRes = await listPaymentVouchers(dataConnect);
        setVouchers(vouchersRes.data.paymentVouchers);
        const extraRes = await listExtraServices(dataConnect);
        setExtraServices(extraRes.data.extraServices);
        const ratesRes = await listServiceRates(dataConnect);
        setServiceRates(ratesRes.data.serviceRates);
"""
content = re.sub(r'(setPayableObligations\(payRes.data.payableObligations\);\n)', r'\1' + fetch_insert, content)

# 3. ADD MISSING HANDLERS
handlers_insert = """
  // --- FLIGHT TICKETS (Boletos) ---
  const handleAddBoleto = async (newBol: FlightTicket) => {
    try {
      newBol.updatedAt = new Date().toISOString();
      setBoletos(prev => [...prev, newBol]);
      await insertFlightTicket(dataConnect, { ...newBol, pasajeros: JSON.stringify(newBol.pasajeros) });
    } catch (e) {}
  };
  const handleUpdateBoleto = async (updated: FlightTicket) => {
    try {
      updated.updatedAt = new Date().toISOString();
      setBoletos(prev => prev.map(b => b.id === updated.id ? updated : b));
      await updateFlightTicket(dataConnect, { ...updated, pasajeros: JSON.stringify(updated.pasajeros) });
    } catch (e) {}
  };
  const handleDeleteBoleto = async (id: string) => {
    try {
      setBoletos(prev => prev.filter(b => b.id !== id));
      await deleteFlightTicket(dataConnect, { id });
    } catch (e) {}
  };

  // --- PAYMENT VOUCHERS ---
  const handleAddVoucher = async (newVoucher: PaymentVoucher) => {
    try {
      newVoucher.updatedAt = new Date().toISOString();
      setVouchers(prev => [...prev, newVoucher]);
      await insertPaymentVoucher(dataConnect, { ...newVoucher });
    } catch (e) {}
  };
  const handleUpdateVoucher = async (updated: PaymentVoucher) => {
    try {
      updated.updatedAt = new Date().toISOString();
      setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
      await updatePaymentVoucher(dataConnect, { ...updated });
    } catch (e) {}
  };

  // --- EXTRA SERVICES & RATES ---
  const handleAddExtraService = async (newSrv: ExtraService) => {
    try {
      setExtraServices(prev => [...prev, newSrv]);
      await insertExtraService(dataConnect, { ...newSrv });
    } catch (e) {}
  };
  const handleUpdateExtraService = async (updated: ExtraService) => {
    try {
      setExtraServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      await updateExtraService(dataConnect, { ...updated });
    } catch (e) {}
  };
  const handleDeleteExtraService = async (id: string) => {
    try {
      setExtraServices(prev => prev.filter(s => s.id !== id));
      await deleteExtraService(dataConnect, { id });
    } catch (e) {}
  };
  const handleAddServiceRate = async (newRate: ServiceRate) => {
    try {
      setServiceRates(prev => [...prev, newRate]);
      await insertServiceRate(dataConnect, { ...newRate });
    } catch (e) {}
  };
  const handleUpdateServiceRate = async (updated: ServiceRate) => {
    try {
      setServiceRates(prev => prev.map(r => r.id === updated.id ? updated : r));
      await updateServiceRate(dataConnect, { ...updated });
    } catch (e) {}
  };
  const handleDeleteServiceRate = async (id: string) => {
    try {
      setServiceRates(prev => prev.filter(r => r.id !== id));
      await deleteServiceRate(dataConnect, { id });
    } catch (e) {}
  };
  const handleDeleteRatePlanGroup = async (planName: string, propertyId: string) => {
    try {
      const plansToDelete = ratePlans.filter(rp => rp.property_id === propertyId && rp.nombrePromocion === planName);
      setRatePlans(prev => prev.filter(rp => !(rp.property_id === propertyId && rp.nombrePromocion === planName)));
      for (const p of plansToDelete) {
        await deleteRatePlan(dataConnect, { id: p.id });
      }
    } catch (e) {}
  };

  // --- PROPIEDADES HANDLERS ---
  const handleAddDetailedProperty = async (newProp: Property) => {
    try {
      setDetailedProperties(prev => [...prev, newProp]);
      await insertDetailedProperty(dataConnect, { ...newProp });
    } catch (e) {}
  };
  const handleUpdateDetailedProperty = async (updatedProp: Property) => {
    try {
      setDetailedProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
      await updateDetailedProperty(dataConnect, { ...updatedProp });
    } catch (e) {}
  };
  const handleDeleteDetailedProperty = async (id: string) => {
    try {
      setDetailedProperties(prev => prev.filter(p => p.id !== id));
      await deleteDetailedProperty(dataConnect, { id });
    } catch (e) {}
  };
  const handleAddRoomType = async (newRoom: RoomType) => {
    try {
      setRoomTypes(prev => [...prev, newRoom]);
      await insertRoomType(dataConnect, { ...newRoom, propertyId: newRoom.property_id });
    } catch (e) {}
  };
  const handleUpdateRoomType = async (updatedRoom: RoomType) => {
    try {
      setRoomTypes(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      await updateRoomType(dataConnect, { ...updatedRoom, propertyId: updatedRoom.property_id });
    } catch (e) {}
  };
  const handleDeleteRoomType = async (id: string) => {
    try {
      setRoomTypes(prev => prev.filter(r => r.id !== id));
      await deleteRoomType(dataConnect, { id });
    } catch (e) {}
  };
  const handleAddRatePlan = async (newRate: RatePlan) => {
    try {
      setRatePlans(prev => [...prev, newRate]);
      await insertRatePlan(dataConnect, { ...newRate, propertyId: newRate.property_id, roomTypeId: newRate.roomType_id });
    } catch (e) {}
  };
  const handleUpdateRatePlan = async (updatedRate: RatePlan) => {
    try {
      setRatePlans(prev => prev.map(r => r.id === updatedRate.id ? updatedRate : r));
      await updateRatePlan(dataConnect, { ...updatedRate, propertyId: updatedRate.property_id, roomTypeId: updatedRate.roomType_id });
    } catch (e) {}
  };
  const handleDeleteRatePlan = async (id: string) => {
    try {
      setRatePlans(prev => prev.filter(r => r.id !== id));
      await deleteRatePlan(dataConnect, { id });
    } catch (e) {}
  };
  const handleAddStopSale = async (newStop: StopSale) => {
    try {
      setStopSales(prev => [...prev, newStop]);
      await insertStopSale(dataConnect, { ...newStop, propertyId: newStop.property_id });
    } catch (e) {}
  };
  const handleUpdateStopSale = async (updatedStop: StopSale) => {
    try {
      setStopSales(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
      await updateStopSale(dataConnect, { ...updatedStop, propertyId: updatedStop.property_id });
    } catch (e) {}
  };
  const handleDeleteStopSale = async (id: string) => {
    try {
      setStopSales(prev => prev.filter(s => s.id !== id));
      await deleteStopSale(dataConnect, { id });
    } catch (e) {}
  };
"""
# Insert handlers before "return ("
content = content.replace("  return (", handlers_insert + "\n  return (")

# 4. FIX PROPS
content = content.replace("setDetailedProperties={setDetailedProperties}", "onAddDetailedProperty={handleAddDetailedProperty}\nonUpdateDetailedProperty={handleUpdateDetailedProperty}\nonDeleteDetailedProperty={handleDeleteDetailedProperty}")
content = content.replace("setRoomTypes={setRoomTypes}", "onAddRoomType={handleAddRoomType}\nonUpdateRoomType={handleUpdateRoomType}\nonDeleteRoomType={handleDeleteRoomType}")
content = content.replace("setRatePlans={setRatePlans}", "onAddRatePlan={handleAddRatePlan}\nonUpdateRatePlan={handleUpdateRatePlan}\nonDeleteRatePlan={handleDeleteRatePlan}\nonDeleteRatePlanGroup={handleDeleteRatePlanGroup}")
content = content.replace("setStopSales={setStopSales}", "onAddStopSale={handleAddStopSale}\nonUpdateStopSale={handleUpdateStopSale}\nonDeleteStopSale={handleDeleteStopSale}")

content = content.replace("<VuelosView \n                     flights={sortedFlights} \n                     onBoletosChange={setFlights} \n                     clients={sortedClients} \n                   />", 
"""<VuelosView 
                     flights={sortedFlights} 
                     boletos={boletos} 
                     clients={sortedClients} 
                     onAddBoleto={handleAddBoleto}
                     onUpdateBoleto={handleUpdateBoleto}
                     onDeleteBoleto={handleDeleteBoleto}
                   />""")

content = content.replace("""                  <CobranzasView 
                    clients={sortedClients} 
                    onUpdateClient={handleUpdateClient} 
                    invoices={sortedInvoices} 
                    onUpdateInvoice={handleUpdateInvoice} 
                    reservations={sortedReservations}
                    onAddInvoice={handleAddInvoice}
                  />""", 
"""                  <CobranzasView 
                    clients={sortedClients} 
                    onUpdateClient={handleUpdateClient} 
                    invoices={sortedInvoices} 
                    onUpdateInvoice={handleUpdateInvoice} 
                    reservations={sortedReservations}
                    onAddInvoice={handleAddInvoice}
                    vouchers={vouchers}
                    onAddVoucher={handleAddVoucher}
                    onUpdateVoucher={handleUpdateVoucher}
                  />""")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Done")
