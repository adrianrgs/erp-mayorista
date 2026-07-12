/**
 * Suite de validación contra los dos PNRs reales proporcionados.
 * Ejecutar con: npx tsx src/lib/parsers/__tests__/pnrParser.test.ts
 */

import { parseGDS, buildRoute, formatGDSDate, SAMPLE_GDS_TEXT } from "../pnrParser";

// ─── COLORES CONSOLA ──────────────────────────────────────────────────────────
const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m";
const C = "\x1b[36m", B = "\x1b[1m", D = "\x1b[0m";

let passed = 0, failed = 0;

function assert(condition: boolean, label: string, got?: unknown) {
  if (condition) {
    console.log(`  ${G}✔${D} ${label}`);
    passed++;
  } else {
    console.log(`  ${R}✘${D} ${label}${got !== undefined ? `  →  got: ${JSON.stringify(got)}` : ""}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n${B}${C}${title}${D}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CASO REAL 1: Reserva Estándar CM — K3W9L2
// ═══════════════════════════════════════════════════════════════════════════════

const REAL_GDS_1 = `reserva estandar: K3W9L2
 1.1GARCIA/CARLOS MR 2.1LOPEZ/MARIA MRS
 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*
 2 CM 472 Y 15NOV 3 PTYMIA HK2  0930  1330   *1A/E*
 3 CM 473 Y 28NOV 2 MIAPTY HK2  1500  1710   *1A/E*
 4 CM 223 Y 28NOV 2 PTYCCS HK2  1830  2145   *1A/E*
TKT/TIME LIMIT
  1.TAW12NOV/1800/CCS
PHONES
  1.CCS 0414 1234567 - AGT
REMARKS
  1.H/OSI CM CTCE EMAILVIAJERO@GMAIL.COM`;

section("CASO REAL 1 — K3W9L2 (Sabre: múltiples pax en línea, día-semana, *1A/E*)");
const r1 = parseGDS(REAL_GDS_1);

console.log("\n  📋 Resultado JSON:");
console.log(JSON.stringify(r1.data, null, 4).split("\n").map(l => "  " + l).join("\n"));

section("  → Validaciones PNR");
assert(r1.data.pnr === "K3W9L2", `PNR = "K3W9L2"`, r1.data.pnr);

section("  → Validaciones Pasajeros (2 en una sola línea)");
assert(r1.data.pasajeros?.length === 2, `2 pasajeros extraídos`, r1.data.pasajeros?.length);
assert(r1.data.pasajeros?.[0].nombre === "GARCIA/CARLOS", `[0] nombre = "GARCIA/CARLOS"`, r1.data.pasajeros?.[0].nombre);
assert(r1.data.pasajeros?.[0].tipo  === "MR",             `[0] tipo  = "MR"`,             r1.data.pasajeros?.[0].tipo);
assert(r1.data.pasajeros?.[1].nombre === "LOPEZ/MARIA",   `[1] nombre = "LOPEZ/MARIA"`,   r1.data.pasajeros?.[1].nombre);
assert(r1.data.pasajeros?.[1].tipo  === "MRS",            `[1] tipo  = "MRS"`,            r1.data.pasajeros?.[1].tipo);

section("  → Validaciones Segmentos (4, con dígito día-semana + *1A/E*)");
assert(r1.data.segmentos?.length === 4, `4 segmentos extraídos`, r1.data.segmentos?.length);

const s1_0 = r1.data.segmentos?.[0];
assert(s1_0?.aerolinea   === "CM",    `SEG1 aerolínea = "CM"`,    s1_0?.aerolinea);
assert(s1_0?.numeroVuelo === "224",   `SEG1 vuelo     = "224"`,   s1_0?.numeroVuelo);
assert(s1_0?.clase       === "Y",     `SEG1 clase     = "Y"`,     s1_0?.clase);
assert(s1_0?.fecha       === "15NOV", `SEG1 fecha     = "15NOV"`, s1_0?.fecha);
assert(s1_0?.origen      === "CCS",   `SEG1 origen    = "CCS"`,   s1_0?.origen);
assert(s1_0?.destino     === "PTY",   `SEG1 destino   = "PTY"`,   s1_0?.destino);
assert(s1_0?.status      === "HK2",   `SEG1 status    = "HK2"`,   s1_0?.status);
assert(s1_0?.horaSalida  === "07:00", `SEG1 salida    = "07:00"`, s1_0?.horaSalida);
assert(s1_0?.horaLlegada === "08:25", `SEG1 llegada   = "08:25"`, s1_0?.horaLlegada);

const s1_3 = r1.data.segmentos?.[3]; // último (CM223 PTYCCS)
assert(s1_3?.origen  === "PTY", `SEG4 origen = "PTY"`, s1_3?.origen);
assert(s1_3?.destino === "CCS", `SEG4 destino = "CCS"`, s1_3?.destino);

section("  → buildRoute (cadena con escalas, sin fusionar engañoso)");
assert(buildRoute(r1.data.segmentos!) === "CCS → PTY → MIA → PTY → CCS",
  `buildRoute = "CCS → PTY → MIA → PTY → CCS"`, buildRoute(r1.data.segmentos!));

section("  → Campos comerciales (TAW, cabina, paxType)");
assert((r1.data.timeLimit || "").includes("12/11"), `timeLimit incluye "12/11" (TAW12NOV)`, r1.data.timeLimit);
assert(s1_0?.cabina === "Economy", `SEG1 cabina = "Economy" (clase Y)`, s1_0?.cabina);
assert(r1.data.pasajeros?.[0].paxType === "ADT", `[0] paxType = "ADT"`, r1.data.pasajeros?.[0].paxType);
assert(r1.data.pasajeros?.[0].titulo === "MR", `[0] titulo = "MR"`, r1.data.pasajeros?.[0].titulo);

// ═══════════════════════════════════════════════════════════════════════════════
//  CASO REAL 2: Reserva Especial AA/LA — X7P4ZQ
// ═══════════════════════════════════════════════════════════════════════════════

const REAL_GDS_2 = `reserva con casos especiales: X7P4ZQ
 1.1SMITH/JOHN MR 2.1SMITH/JANE MRS 3.1SMITH/TOMMY CHD
 1 AA 902 Q 10DEC 5 MIA SCL HK3  2230  0840+1 *1A/E*
 2 LA 144 Y 11DEC 6 SCL CJC HK3  1100  1310   *1A/E*
TKT/TIME LIMIT
  1.T-05DEC-1200
PHONES
  1.MIA 305 5551234 - B2B AGENCY`;

section("CASO REAL 2 — X7P4ZQ (3 pax en línea, IATA separados, +1 día siguiente)");
const r2 = parseGDS(REAL_GDS_2);

console.log("\n  📋 Resultado JSON:");
console.log(JSON.stringify(r2.data, null, 4).split("\n").map(l => "  " + l).join("\n"));

section("  → Validaciones PNR");
assert(r2.data.pnr === "X7P4ZQ", `PNR = "X7P4ZQ"`, r2.data.pnr);

section("  → Validaciones Pasajeros (3 en una sola línea, incluyendo CHD)");
assert(r2.data.pasajeros?.length === 3,                   `3 pasajeros extraídos`, r2.data.pasajeros?.length);
assert(r2.data.pasajeros?.[0].nombre === "SMITH/JOHN",    `[0] nombre = "SMITH/JOHN"`,  r2.data.pasajeros?.[0].nombre);
assert(r2.data.pasajeros?.[0].tipo   === "MR",            `[0] tipo   = "MR"`,          r2.data.pasajeros?.[0].tipo);
assert(r2.data.pasajeros?.[1].nombre === "SMITH/JANE",    `[1] nombre = "SMITH/JANE"`,  r2.data.pasajeros?.[1].nombre);
assert(r2.data.pasajeros?.[1].tipo   === "MRS",           `[1] tipo   = "MRS"`,         r2.data.pasajeros?.[1].tipo);
assert(r2.data.pasajeros?.[2].nombre === "SMITH/TOMMY",   `[2] nombre = "SMITH/TOMMY"`, r2.data.pasajeros?.[2].nombre);
assert(r2.data.pasajeros?.[2].tipo   === "CHD",           `[2] tipo   = "CHD"`,         r2.data.pasajeros?.[2].tipo);

section("  → Validaciones Segmentos (IATA separados por espacio + +1 overnight)");
assert(r2.data.segmentos?.length === 2, `2 segmentos extraídos`, r2.data.segmentos?.length);

const s2_0 = r2.data.segmentos?.[0]; // AA902 MIA→SCL (overnight)
assert(s2_0?.aerolinea   === "AA",    `SEG1 aerolínea = "AA"`,    s2_0?.aerolinea);
assert(s2_0?.numeroVuelo === "902",   `SEG1 vuelo     = "902"`,   s2_0?.numeroVuelo);
assert(s2_0?.clase       === "Q",     `SEG1 clase     = "Q"`,     s2_0?.clase);
assert(s2_0?.fecha       === "10DEC", `SEG1 fecha     = "10DEC"`, s2_0?.fecha);
assert(s2_0?.origen      === "MIA",   `SEG1 origen    = "MIA"`,   s2_0?.origen);
assert(s2_0?.destino     === "SCL",   `SEG1 destino   = "SCL"`,   s2_0?.destino);
assert(s2_0?.status      === "HK3",   `SEG1 status    = "HK3"`,   s2_0?.status);
assert(s2_0?.horaSalida  === "22:30", `SEG1 salida    = "22:30"`, s2_0?.horaSalida);
assert(s2_0?.horaLlegada?.startsWith("08:40"), `SEG1 llegada   empieza "08:40" (con +1)`, s2_0?.horaLlegada);
assert(s2_0?.horaLlegada?.includes("+1"),      `SEG1 llegada   contiene "+1" (overnight)`, s2_0?.horaLlegada);

const s2_1 = r2.data.segmentos?.[1]; // LA144 SCL→CJC
assert(s2_1?.aerolinea   === "LA",    `SEG2 aerolínea = "LA"`,    s2_1?.aerolinea);
assert(s2_1?.origen      === "SCL",   `SEG2 origen    = "SCL"`,   s2_1?.origen);
assert(s2_1?.destino     === "CJC",   `SEG2 destino   = "CJC"`,   s2_1?.destino);

section("  → buildRoute (muestra la escala en SCL)");
assert(buildRoute(r2.data.segmentos!) === "MIA → SCL → CJC",
  `buildRoute = "MIA → SCL → CJC" (con escala, no fusionado)`, buildRoute(r2.data.segmentos!));

// ═══════════════════════════════════════════════════════════════════════════════
//  CASOS ADICIONALES: Helpers y texto de muestra
// ═══════════════════════════════════════════════════════════════════════════════

section("HELPERS — formatGDSDate (año inferido con rollover)");
const refDate = new Date("2026-06-15T00:00:00");
assert(formatGDSDate("15NOV", refDate) === "15/11/2026", `"15NOV" (ref jun-26) → "15/11/2026"`, formatGDSDate("15NOV", refDate));
assert(formatGDSDate("10DEC", refDate) === "10/12/2026", `"10DEC" (ref jun-26) → "10/12/2026"`, formatGDSDate("10DEC", refDate));
assert(formatGDSDate("01JAN", refDate) === "01/01/2027", `"01JAN" (ref jun-26) → "01/01/2027" (rollover a año siguiente)`, formatGDSDate("01JAN", refDate));

section("ROBUSTEZ — status no estándar, pax sin título, apóstrofe/guion, ida-vuelta");
const rRobust = parseGDS(`ZZ9K1P
 1.1PEREZ/ANA 2.1O'BRIEN/SEAN-PAUL MR
 1 AV 88 J 03MAR 1 BOGMIA GK1  0800  1230
 2 AV 89 J 10MAR 1 MIABOG SS1  1400  1830`);
assert(rRobust.data.segmentos?.length === 2, `2 segmentos con status GK/SS (antes se perdían)`, rRobust.data.segmentos?.length);
assert(rRobust.data.segmentos?.[0].status === "GK1", `SEG1 status = "GK1" (genérico)`, rRobust.data.segmentos?.[0].status);
assert(rRobust.data.segmentos?.[0].cabina === "Business", `SEG1 cabina = "Business" (clase J)`, rRobust.data.segmentos?.[0].cabina);
assert(rRobust.data.pasajeros?.length === 2, `2 pax (uno SIN título)`, rRobust.data.pasajeros?.length);
assert(rRobust.data.pasajeros?.[0].nombre === "PEREZ/ANA", `[0] pax sin título extraído`, rRobust.data.pasajeros?.[0].nombre);
assert(rRobust.data.pasajeros?.[1].nombre === "O'BRIEN/SEAN-PAUL", `[1] apellido/nombre con apóstrofe y guion`, rRobust.data.pasajeros?.[1].nombre);
assert(buildRoute(rRobust.data.segmentos!) === "BOG ⇄ MIA", `ida-vuelta directa → "BOG ⇄ MIA"`, buildRoute(rRobust.data.segmentos!));

section("ROBUSTEZ — Amadeus índice simple (1.NOMBRE) + sufijos (SRC)/(CHD/08)");
const rAma = parseGDS(`RP/BOGK22100/BOGK22100            AMX        12JUL26/0840Z   XJ9K2A
  1.GOMEZ/CARLOS MR
  2.GOMEZ/MARIA MRS (SRC)
  3.GOMEZ/MATEO MSTR (CHD/08)
  4 XX 124 Y 15OCT BOGLIM HK3  0800 1100   O E
  5 XX 125 Y 25OCT LIMBOG HK3  1500 1800   O E
  7 TK TAW 15AUG/1200
 10 SSR DOCS XX HK1 P1/CO/12345678/CO/15MAR80/M/15OCT28/GOMEZ/CARLOS`);
assert(rAma.data.pnr === "XJ9K2A", `PNR Amadeus = "XJ9K2A"`, rAma.data.pnr);
assert(rAma.data.pasajeros?.length === 3, `3 pax con índice simple "1." (antes 0)`, rAma.data.pasajeros?.length);
assert(rAma.data.pasajeros?.[0].nombre === "GOMEZ/CARLOS", `[0] GOMEZ/CARLOS`, rAma.data.pasajeros?.[0].nombre);
assert(rAma.data.pasajeros?.[1].tipo === "SRC", `[1] tercera edad → tipo "SRC"`, rAma.data.pasajeros?.[1].tipo);
assert(rAma.data.pasajeros?.[1].titulo === "MRS", `[1] título de cortesía "MRS" preservado`, rAma.data.pasajeros?.[1].titulo);
assert(rAma.data.pasajeros?.[2].tipo === "CHD", `[2] niño (CHD/08) → tipo "CHD"`, rAma.data.pasajeros?.[2].tipo);
assert(rAma.data.pasajeros?.[2].paxType === "CHD", `[2] paxType tarifario "CHD"`, rAma.data.pasajeros?.[2].paxType);
assert(rAma.data.segmentos?.length === 2, `2 segmentos (línea SSR DOCS no confunde)`, rAma.data.segmentos?.length);

section("KIU — localizador REC:, segmentos /E, e-ticket línea FA");
const rKiu = parseGDS(`KIU SYSTEM - PNR DISPLAY
REC: ZM8R3P  ST: ACTIVE  GDS: KIU  12JUL26/1415Z
1.1RODRIGUEZ/ANTONIO MR
1  QL 902 Y 18SEP CCSPMV HK1  1130 1215 /E
2  QL 905 Y 25SEP PMVCCS HK1  1300 1345 /E
3 AP CCS +58 212 999 8888 AGY-A
4 TK OK 12JUL/QL*A3B2C5
7 SSR DOCS QL HK1 P1/V/VE/12345678/VE/05MAY95/M/18SEP30/RODRIGUEZ/ANTONIO
8 FA 775 2400123456 /P1/S1-2/12JUL26`);
assert(rKiu.data.pnr === "ZM8R3P", `PNR KIU "REC:" = "ZM8R3P"`, rKiu.data.pnr);
assert(rKiu.data.pasajeros?.length === 1, `1 pax`, rKiu.data.pasajeros?.length);
assert(rKiu.data.pasajeros?.[0].nombre === "RODRIGUEZ/ANTONIO", `pax RODRIGUEZ/ANTONIO`, rKiu.data.pasajeros?.[0].nombre);
assert(rKiu.data.segmentos?.length === 2, `2 segmentos (sufijo "/E" no estorba)`, rKiu.data.segmentos?.length);
assert(rKiu.data.segmentos?.[0].origen === "CCS" && rKiu.data.segmentos?.[0].destino === "PMV", `SEG1 CCS→PMV`, rKiu.data.segmentos?.[0]);
assert(rKiu.data.ticketNumero === "775-2400123456", `e-ticket línea FA = "775-2400123456"`, rKiu.data.ticketNumero);
assert(buildRoute(rKiu.data.segmentos!) === "CCS ⇄ PMV", `ida-vuelta → "CCS ⇄ PMV"`, buildRoute(rKiu.data.segmentos!));
assert((rKiu.warnings ?? []).length === 0, `sin advertencias`, rKiu.warnings);

section("KIU multi-pax — SRC/CHD pegados al título + e-ticket por pasajero (FA /Pn)");
const rKiu3 = parseGDS(`KIU SYSTEM - PNR DISPLAY
REC: M9K2XP  ST: ACTIVE  GDS: KIU  12JUL26/1630Z
1.1GOMEZ/CARLOS MR
2.1GOMEZ/MARIA MRS(SRC)
3.1GOMEZ/MATEO MSTR(CHD/08)
1  QL 902 Y 18OCT CCSPMV HK3  1130 1215 /E
2  QL 905 Y 25OCT PMVCCS HK3  1300 1345 /E
9 SSR DOCS QL HK1 P1/V/VE/12345678/VE/15MAR80/M/18OCT30/GOMEZ/CARLOS
12 FA 775 2400123456 /P1/S1-2/12JUL26
13 FA 775 2400123457 /P2/S1-2/12JUL26
14 FA 775 2400123458 /P3/S1-2/12JUL26`);
assert(rKiu3.data.pasajeros?.length === 3, `3 pax`, rKiu3.data.pasajeros?.length);
assert(rKiu3.data.pasajeros?.[1].tipo === "SRC", `[1] "MRS(SRC)" sin espacio → tipo "SRC"`, rKiu3.data.pasajeros?.[1].tipo);
assert(rKiu3.data.pasajeros?.[2].tipo === "CHD", `[2] "MSTR(CHD/08)" sin espacio → tipo "CHD"`, rKiu3.data.pasajeros?.[2].tipo);
assert(rKiu3.data.pasajeros?.[0].ticketNumero === "775-2400123456", `[0] e-ticket P1`, rKiu3.data.pasajeros?.[0].ticketNumero);
assert(rKiu3.data.pasajeros?.[1].ticketNumero === "775-2400123457", `[1] e-ticket P2`, rKiu3.data.pasajeros?.[1].ticketNumero);
assert(rKiu3.data.pasajeros?.[2].ticketNumero === "775-2400123458", `[2] e-ticket P3`, rKiu3.data.pasajeros?.[2].ticketNumero);
assert(rKiu3.data.ticketNumero === "775-2400123456", `e-ticket boleto = P1`, rKiu3.data.ticketNumero);

section("HELPERS — Entrada inválida");
const rEmpty = parseGDS("");
assert(rEmpty.status === "error", `Texto vacío → status "error"`, rEmpty.status);

section("SAMPLE_GDS_TEXT — Texto de muestra");
const rSample = parseGDS(SAMPLE_GDS_TEXT);
assert(rSample.data.pnr === "K3W9L2",                  `Sample PNR = "K3W9L2"`,     rSample.data.pnr);
assert((rSample.data.pasajeros?.length ?? 0) >= 2,      `Sample ≥ 2 pasajeros`,      rSample.data.pasajeros?.length);
assert((rSample.data.segmentos?.length ?? 0) >= 4,      `Sample ≥ 4 segmentos`,      rSample.data.segmentos?.length);

// ═══════════════════════════════════════════════════════════════════════════════
//  RESUMEN FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${B}${"─".repeat(55)}${D}`);
const total = passed + failed;
console.log(
  `${B}Resultado: ${G}${passed}/${total} pasados${D}` +
  (failed > 0 ? `  ${R}(${failed} fallados)${D}` : `  ${G}✔ Todos OK${D}`)
);

// Mostrar advertencias del parser si las hay
[r1, r2, rSample].forEach((r, i) => {
  if (r.warnings.length > 0) {
    console.log(`\n${Y}Advertencias caso ${i + 1}:${D}`);
    r.warnings.forEach(w => console.log(`  ${Y}${w}${D}`));
  }
});

console.log();
process.exit(failed > 0 ? 1 : 0);
