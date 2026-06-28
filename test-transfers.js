const { execSync } = require('child_process');

try {
  const result = execSync('curl -s -X POST -H "Content-Type: application/json" -d \'{"query":"query { transferServices { id reservationId date status pickupLocation direction } }"}\' http://localhost:9399/dataconnect/transferServices');
  console.log("Result:", result.toString());
} catch (e) {
  console.error(e);
}
