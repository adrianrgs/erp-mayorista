const fs = require('fs');
let file = 'src/views/CobranzasView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}`,
  `onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value, reference: e.target.value === "Saldo a Favor" ? "SALDO-FAVOR" : prev.reference }))}`
);

fs.writeFileSync(file, content);
console.log("Done");
