/**
 * reset-data.mjs
 * Limpia todos los datos transaccionales del ERP (reservas, facturas, obligaciones, etc.)
 * Conserva: catálogo de hoteles, tipos de habitación, tarifas, flota, proveedores,
 *            clientes B2B (resetea saldos a 0), tasas de cambio, jurisdicción fiscal.
 *
 * Uso:
 *   node scripts/reset-data.mjs
 *   node scripts/reset-data.mjs --dry-run   (muestra qué se borraría sin ejecutar)
 */

import https from "https";
import http from "http";

const BASE_URL = "http://localhost:3001/api";
const USERNAME  = "admin";
const PASSWORD  = "foratour2026";
const DRY_RUN   = process.argv.includes("--dry-run");

// ── HTTP helper ────────────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve({}); }
        } else {
          reject(new Error(`HTTP ${res.statusCode} ${method} ${path}: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Login ──────────────────────────────────────────────────────────────────────

async function login() {
  const res = await request("POST", "/auth/login", { username: USERNAME, password: PASSWORD });
  return res.access_token;
}

// ── Delete all records of a collection ────────────────────────────────────────

async function deleteAll(token, label, listPath, deletePath) {
  let records;
  try {
    records = await request("GET", listPath, null, token);
  } catch (e) {
    console.warn(`  ⚠ No se pudo listar ${label}: ${e.message}`);
    return 0;
  }

  if (!Array.isArray(records)) records = [];
  const n = records.length;

  if (n === 0) {
    console.log(`  ✓ ${label}: vacío (nada que borrar)`);
    return 0;
  }

  if (DRY_RUN) {
    console.log(`  ~ ${label}: ${n} registro(s) se eliminarían`);
    return n;
  }

  let deleted = 0;
  for (const rec of records) {
    try {
      await request("DELETE", `${deletePath}/${rec.id}`, null, token);
      deleted++;
    } catch (e) {
      console.warn(`    ⚠ No se pudo eliminar ${rec.id}: ${e.message}`);
    }
  }
  console.log(`  ✓ ${label}: ${deleted}/${n} eliminados`);
  return deleted;
}

// ── Reset client balances to zero ─────────────────────────────────────────────

async function resetClientBalances(token) {
  let clients;
  try {
    clients = await request("GET", "/clients", null, token);
  } catch (e) {
    console.warn(`  ⚠ No se pudo listar clientes: ${e.message}`);
    return;
  }

  if (!Array.isArray(clients) || clients.length === 0) {
    console.log("  ✓ Clientes B2B: ninguno registrado");
    return;
  }

  if (DRY_RUN) {
    console.log(`  ~ Clientes B2B: se resetearían saldos de ${clients.length} cliente(s)`);
    return;
  }

  let reset = 0;
  for (const c of clients) {
    if (c.saldoDeber === 0 && c.saldoFavor === 0 && !c.moroso) continue;
    try {
      await request("PATCH", `/clients/${c.id}`, {
        saldoDeber: 0,
        saldoFavor: 0,
        moroso: false,
      }, token);
      reset++;
    } catch (e) {
      console.warn(`    ⚠ No se pudo resetear cliente ${c.id}: ${e.message}`);
    }
  }
  console.log(`  ✓ Clientes B2B: saldos reseteados en ${reset}/${clients.length} cliente(s)`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(58));
  console.log(" ERP Mayorista — Reset de Datos Transaccionales");
  if (DRY_RUN) console.log(" MODO DRY-RUN: no se eliminará nada");
  console.log("=".repeat(58));

  let token;
  try {
    token = await login();
    console.log("\n✓ Login exitoso\n");
  } catch (e) {
    console.error("✗ Error de login:", e.message);
    console.error("  Verifica que el servidor esté corriendo en localhost:3001");
    process.exit(1);
  }

  console.log("── Datos transaccionales ─────────────────────────────");
  await deleteAll(token, "Reservas",              "/reservations",                  "/reservations");
  await deleteAll(token, "Boletos Aéreos",         "/flights/tickets",               "/flights/tickets");
  await deleteAll(token, "Servicios de Traslado",  "/transfers",                     "/transfers");
  await deleteAll(token, "Facturas Emitidas",      "/finances/invoices",             "/finances/invoices");
  await deleteAll(token, "Comprobantes de Pago",   "/finances/vouchers",             "/finances/vouchers");
  await deleteAll(token, "Obligaciones de Pago",   "/finances/obligations",          "/finances/obligations");
  await deleteAll(token, "Estados de Cuenta",      "/finances/statements",           "/finances/statements");
  await deleteAll(token, "Retenciones (IVA/ISLR)", "/finances/withholding-certificates", "/finances/withholding-certificates");

  console.log("\n── Datos de clientes ─────────────────────────────────");
  await resetClientBalances(token);

  console.log("\n── Datos en localStorage (manual) ───────────────────");
  console.log("  Abre la consola del navegador (F12) y ejecuta:");
  console.log("  localStorage.removeItem('journal_entries');");
  console.log("  localStorage.removeItem('withholding_certificates');");
  console.log("  Luego recarga la página (F5).");

  console.log("\n── Lo que se conserva ────────────────────────────────");
  console.log("  ✓ Catálogo de hoteles y habitaciones (DetailedProperties, RoomTypes, RatePlans)");
  console.log("  ✓ Configuración de stopSales");
  console.log("  ✓ Catálogo de servicios extra y tarifas");
  console.log("  ✓ Flota (vehículos y conductores)");
  console.log("  ✓ Proveedores");
  console.log("  ✓ Clientes B2B (saldos reseteados a 0)");
  console.log("  ✓ Jurisdicción fiscal y tasas de cambio");
  console.log("  ✓ Configuración de la empresa");

  console.log("\n" + "=".repeat(58));
  console.log(DRY_RUN ? " Dry-run completo. Ejecuta sin --dry-run para confirmar." : " ✓ Limpieza completada.");
  console.log("=".repeat(58) + "\n");
}

main();
