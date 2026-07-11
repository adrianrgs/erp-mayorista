// Manejo de comprobantes/adjuntos.
//
// Históricamente el campo `attachedFile` guardaba SOLO el nombre del archivo (el contenido
// se descartaba), así que no se podía re-descargar. Para poder descargarlo de verdad sin
// cambiar el esquema, empaquetamos { nombre + contenido (data URL base64) } como un único
// string JSON en el mismo campo. `parseAttachment` es retrocompatible: acepta tanto los
// valores viejos (solo nombre) como los nuevos (JSON con data URL).

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB

export interface ParsedAttachment {
  name: string;
  dataUrl?: string;
}

/** Empaqueta nombre + contenido (data URL) para persistir en `attachedFile`. */
export const packAttachment = (name: string, dataUrl: string): string =>
  JSON.stringify({ n: name, d: dataUrl });

/** Lee el campo `attachedFile`. Retrocompatible con valores que solo tienen el nombre. */
export const parseAttachment = (value?: string | null): ParsedAttachment => {
  if (!value) return { name: "" };
  if (value.startsWith("{")) {
    try {
      const o = JSON.parse(value);
      if (o && typeof o.n === "string") {
        return { name: o.n, dataUrl: typeof o.d === "string" ? o.d : undefined };
      }
    } catch {
      /* no era JSON válido → se trata como nombre plano */
    }
  }
  return { name: value };
};

/** ¿El adjunto tiene contenido descargable (no solo el nombre)? */
export const hasDownloadableFile = (value?: string | null): boolean =>
  !!parseAttachment(value).dataUrl;

/** Lee un File del input como data URL base64. */
export const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Dispara la descarga del comprobante en el navegador. */
export const downloadAttachment = (att: ParsedAttachment): void => {
  if (!att.dataUrl) return;
  const a = document.createElement("a");
  a.href = att.dataUrl;
  a.download = att.name || "comprobante";
  document.body.appendChild(a);
  a.click();
  a.remove();
};
