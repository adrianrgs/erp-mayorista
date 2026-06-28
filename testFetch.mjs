const url = "https://firebasedataconnect.googleapis.com/v1beta/projects/foratour-erp-2026/locations/us-central1/services/foratour-erp/operations/ListInvoices?variables={}";
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': "AIzaSyBymL7A3onyUvUZXFHpIrT4IKe66LAo9Zw"
  }
});
console.log(response.status);
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
