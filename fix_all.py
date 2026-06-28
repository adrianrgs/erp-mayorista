import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Inject useEffect
use_effect = """
  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await listReservations(dataConnect);
        if (res.data.reservations.length > 0) setReservations(res.data.reservations);
        const cli = await listClients(dataConnect);
        if (cli.data.clients.length > 0) setClients(cli.data.clients);
        const inv = await listInvoices(dataConnect);
        if (inv.data.invoices.length > 0) setInvoices(inv.data.invoices);
        const props = await listDetailedProperties(dataConnect);
        if (props.data.detailedProperties.length > 0) setDetailedProperties(props.data.detailedProperties);
        const rooms = await listRoomTypes(dataConnect);
        if (rooms.data.roomTypes.length > 0) setRoomTypes(rooms.data.roomTypes);
        const rates = await listRatePlans(dataConnect);
        if (rates.data.ratePlans.length > 0) setRatePlans(rates.data.ratePlans);
        const stops = await listStopSales(dataConnect);
        if (stops.data.stopSales.length > 0) setStopSales(stops.data.stopSales);
        const tickets = await listFlightTickets(dataConnect);
        if (tickets.data.flightTickets.length > 0) setBoletos(tickets.data.flightTickets);
        const trans = await listTransferServices(dataConnect);
        if (trans.data.transferServices.length > 0) setTransfers(trans.data.transferServices);
        const veh = await listFleetVehicles(dataConnect);
        if (veh.data.fleetVehicles.length > 0) setFleetVehicles(veh.data.fleetVehicles);
        const dri = await listFleetDrivers(dataConnect);
        if (dri.data.fleetDrivers.length > 0) setFleetDrivers(dri.data.fleetDrivers);
        const vou = await listPaymentVouchers(dataConnect);
        if (vou.data.paymentVouchers.length > 0) setVouchers(vou.data.paymentVouchers);
        const ext = await listExtraServices(dataConnect);
        if (ext.data.extraServices.length > 0) setExtraServices(ext.data.extraServices);
        const srv = await listServiceRates(dataConnect);
        if (srv.data.serviceRates.length > 0) setServiceRates(srv.data.serviceRates);
        const obs = await listPayableObligations(dataConnect);
        if (obs.data.payableObligations.length > 0) setPayableObligations(obs.data.payableObligations);
        const stm = await listProviderStatements(dataConnect);
        if (stm.data.providerStatements.length > 0) setProviderStatements(stm.data.providerStatements);
      } catch (err) {
        console.error("Failed to load Firebase data", err);
      }
    }
    loadData();
  }, []);
"""
if "listReservations(dataConnect)" not in content:
    content = content.replace("const [isFase0SkeletonView, setIsFase0SkeletonView] = useState<boolean>(false);", "const [isFase0SkeletonView, setIsFase0SkeletonView] = useState<boolean>(false);\n" + use_effect)

# 2. Fix the handlers that were broken
def fix_handler(content, func_name, db_func, arg_name):
    # e.g. const handleAddReservation = (newRes: Reservation) => {
    # replace with async and await insertReservation(dataConnect, { ...newRes })
    pattern = rf"const {func_name} = \({arg_name}: [a-zA-Z0-9_]+\) => \{{\n"
    replacement = f"const {func_name} = async ({arg_name}: any) => {{\n    {arg_name}.updatedAt = new Date().toISOString();\n"
    content = re.sub(pattern, replacement, content)
    
    # Now find where the setState is (e.g. setReservations) and insert the await after it
    # We will just do a simple replacement if it's not already there
    return content

# A list of tuples (func_name, db_func, arg_name, state_setter)
handlers = [
    ("handleAddReservation", "insertReservation", "newRes", "setReservations"),
    ("handleUpdateReservation", "updateReservation", "updatedRes", "setReservations"),
    ("handleAddClient", "insertClient", "newClient", "setClients"),
    ("handleUpdateClient", "updateClient", "updated", "setClients"),
    ("handleAddInvoice", "insertInvoice", "newInv", "setInvoices"),
    ("handleUpdateInvoice", "updateInvoice", "updated", "setInvoices"),
    ("handleUpdateObligation", "updatePayableObligation", "updated", "setPayableObligations"),
    ("handleAddPayableObligation", "insertPayableObligation", "newObligation", "setPayableObligations"),
    ("handleAddStatement", "insertProviderStatement", "newDoc", "setProviderStatements"),
    ("handleUpdateProperty", "updateDetailedProperty", "updated", "setProperties"),
    ("handleUpdateVehicle", "updateFleetVehicle", "updated", "setFleetVehicles"),
    ("handleAddVehicle", "insertFleetVehicle", "newV", "setFleetVehicles"),
    ("handleUpdateDriver", "updateFleetDriver", "updated", "setFleetDrivers"),
    ("handleAddDriver", "insertFleetDriver", "newD", "setFleetDrivers")
]

for func_name, db_func, arg_name, state_setter in handlers:
    content = fix_handler(content, func_name, db_func, arg_name)

# Now manually add the awaits inside those functions
for func_name, db_func, arg_name, state_setter in handlers:
    # Find the closing brace of the setState
    # e.g. setReservations(prev => [newRes, ...prev]);
    pattern = rf"({state_setter}\([^)]+\);)"
    if db_func not in content:
        # Just inject it after the state setter
        content = re.sub(pattern, rf"\1\n    try {{ await {db_func}(dataConnect, {{ ...{arg_name} }}); }} catch(e) {{ console.error(e) }}", content)

with open("src/App.tsx", "w") as f:
    f.write(content)
