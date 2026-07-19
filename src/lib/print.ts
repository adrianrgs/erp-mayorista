// Imprime ÚNICAMENTE el elemento con el id dado. Clona el nodo, oculta #root (para que el
// resto de la app no aparezca en el papel), lo agrega al body y llama window.print(); luego
// restaura todo. Aprovecha las reglas @media print de src/index.css que hacen visibles solo
// `.print-receipt` / `.print-manifest`. Es el patrón que ya usaban varios paneles (comprobantes,
// vouchers, liquidaciones), extraído para reutilizarlo.
export function printElementById(id: string): void {
  const printContent = document.getElementById(id);
  const root = document.getElementById("root");
  if (!printContent || !root) return;

  const clone = printContent.cloneNode(true) as HTMLElement;
  clone.id = `${id}-print-clone`;
  clone.style.position = "absolute";
  clone.style.top = "0";
  clone.style.left = "0";
  clone.style.width = "100%";
  clone.style.backgroundColor = "white";
  clone.style.zIndex = "999999";
  clone.style.padding = "20px";

  root.style.display = "none";
  document.body.appendChild(clone);

  setTimeout(() => {
    window.print();
    document.body.removeChild(clone);
    root.style.display = "";
  }, 150);
}
