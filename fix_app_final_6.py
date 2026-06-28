import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add the states
state_insert = """
  const [boletos, setBoletos] = useState<FlightTicket[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>([]);
"""
content = re.sub(r'(const \[payableObligations, setPayableObligations\] = useState<PayableObligation\[\]>\(initialPayableObligations\);)', r'\1' + state_insert, content)

# Fix ServiceRate String vs string issue
content = content.replace("String", "string")

# Fix OperacionesView handleUpdateTransfer parameter
# wait, OperacionesView expects (updated: OperationalTransfer) => void
content = content.replace("const handleUpdateTransfer = async (updated: TransferService) => {", "const handleUpdateTransfer = async (updated: OperationalTransfer) => {")

with open("src/App.tsx", "w") as f:
    f.write(content)
