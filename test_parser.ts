import { parseGDS, SAMPLE_GDS_TEXT } from "./src/lib/parsers/pnrParser.ts";
const res = parseGDS(SAMPLE_GDS_TEXT);
console.log(JSON.stringify(res.data.segmentos, null, 2));
