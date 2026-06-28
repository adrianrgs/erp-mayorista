import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix ServiciosView and BuscadorGlobalView
old_render = """                  {currentSection === ProjectView.SERVICIOS_VARIOS && (
                    <ServiciosView 
                      extraServices={extraServices}
                      onAddExtraService={handleAddExtraService}
                      onUpdateExtraService={handleUpdateExtraService}
                      
                      serviceRates={serviceRates}
                      onAddServiceRate={handleAddServiceRate}
                      onUpdateServiceRate={handleUpdateServiceRate}
                    />
                  )}
                  {currentSection === ProjectView.BUSCADOR && (
                    <BuscadorGlobalView 
                      reservations={reservations} 
                      invoices={invoices} 
                      
                    />
                  )}"""

new_render = """                  {currentSection === ProjectView.SERVICIOS_VARIOS && (
                    <ServiciosView 
                      extraServices={extraServices}
                      onAddExtraService={handleAddExtraService}
                      onUpdateExtraService={handleUpdateExtraService}
                      serviceRates={serviceRates}
                      onAddServiceRate={handleAddServiceRate}
                      onDeleteServiceRate={handleDeleteServiceRate}
                    />
                  )}
                  {currentSection === ProjectView.BUSCADOR && (
                    <BuscadorGlobalView 
                      reservations={reservations} 
                      invoices={invoices} 
                      boletos={boletos}
                      payableObligations={payableObligations}
                      onNavigate={setCurrentSection}
                    />
                  )}"""
# Because I might have mis-formatted it in fix_props, I'll use regex to replace everything between ProjectView.SERVICIOS_VARIOS and ProjectView.RESERVAS
start = content.find("{currentSection === ProjectView.SERVICIOS_VARIOS && (")
end = content.find("{currentSection === ProjectView.RESERVAS && (")
if start != -1 and end != -1:
    content = content[:start] + new_render + "\n                  " + content[end:]

# Re-add clients={clients}
views = ["ReservasView", "FacturacionView", "ClientesView", "CobranzasView"]
for view in views:
    # Find <ViewName
    # Then find />
    # Inject clients={clients} inside
    match = re.search(rf'<{view}[^>]*/>', content)
    if match:
        tag = match.group(0)
        if "clients={" not in tag:
            new_tag = tag.replace(f'<{view}', f'<{view}\n                      clients={{clients}}')
            content = content.replace(tag, new_tag)

with open("src/App.tsx", "w") as f:
    f.write(content)
