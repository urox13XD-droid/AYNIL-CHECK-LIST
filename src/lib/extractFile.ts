/** Extraction du texte d'un PDF (texte natif, pas de scan) via pdf.js, côté navigateur uniquement. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      }
      line += item.str + " ";
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
  }
  return lines.join("\n");
}

/** OCR d'une image (photo ou scan de liste) via Tesseract.js, entièrement côté navigateur. */
export async function extractImageText(
  file: File,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng", {
    // self-hosted: avoids depending on the jsdelivr CDN at runtime (blocked on
    // some corporate/restricted networks, and we want this to work offline)
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
    langPath: "/tessdata",
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  return data.text;
}

export type ImportKind = "text" | "csv" | "pdf" | "image";

export function detectKind(file: File): ImportKind {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(jpe?g|png)$/.test(name)) return "image";
  if (file.type === "text/csv" || name.endsWith(".csv")) return "csv";
  return "text";
}
