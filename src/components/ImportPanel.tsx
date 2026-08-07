"use client";

import { useCallback, useRef, useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { CATEGORY_LABELS, CATEGORY_ORDER, EquipCategory } from "@/lib/catalog";
import { detectKind, extractImageText, extractPdfText } from "@/lib/extractFile";
import { extractTextFromFile, ParsedLine } from "@/lib/parse";

export function ImportPanel({
  rawText,
  onRawTextChange,
  onAnalyze,
  parsedLines,
  onUpdateLine,
  onGenerate,
}: {
  rawText: string;
  onRawTextChange: (v: string) => void;
  onAnalyze: () => void;
  parsedLines: ParsedLine[] | null;
  onUpdateLine: (id: string, patch: Partial<ParsedLine>) => void;
  onGenerate: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState<"pdf" | "image" | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setExtractError(null);
      const kind = detectKind(file);
      try {
        if (kind === "pdf") {
          setExtracting("pdf");
          const text = await extractPdfText(file);
          if (!text.trim()) {
            setExtractError("Aucun texte trouvé dans ce PDF (probablement un scan/image). Essayez de l'exporter en JPEG/PNG et de le déposer ici pour l'OCR.");
          } else {
            onRawTextChange(text);
          }
        } else if (kind === "image") {
          setExtracting("image");
          setOcrProgress(0);
          const text = await extractImageText(file, setOcrProgress);
          if (!text.trim()) {
            setExtractError("Aucun texte détecté sur cette image. Essayez une photo plus nette ou mieux cadrée.");
          } else {
            onRawTextChange(text);
          }
        } else {
          const raw = await file.text();
          onRawTextChange(extractTextFromFile(file.name, raw));
        }
      } catch {
        setExtractError("Impossible de lire ce fichier. Vous pouvez toujours coller le texte directement.");
      } finally {
        setExtracting(null);
      }
    },
    [onRawTextChange]
  );

  const matched = parsedLines?.filter((l) => l.rule) ?? [];
  const unmatched = parsedLines?.filter((l) => !l.rule) ?? [];

  return (
    <aside className="no-print flex h-full w-96 shrink-0 flex-col border-r-[3px] border-black bg-white">
      <div className="border-b-[3px] border-black p-3">
        <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-wider">
          Liste de matériel
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`relative rounded-lg border-[2px] border-dashed p-1 transition ${
            dragOver ? "border-black bg-black/5" : "border-black/40"
          }`}
        >
          <textarea
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder={"Collez la liste du loueur ici, ou glissez un fichier .txt / .csv / .pdf / .jpg…\n\nEx.\n1x ARRI Alexa 35\n2x Teradek Bolt 6 TX\nSmallHD Ultra 5"}
            rows={9}
            disabled={extracting !== null}
            className="w-full resize-none rounded-md border-0 bg-transparent p-2 text-xs font-semibold outline-none placeholder:font-normal placeholder:text-black/40 disabled:opacity-50"
          />
          {extracting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/90 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide">
                {extracting === "pdf" ? "Lecture du PDF…" : "Lecture de l'image (OCR)…"}
              </p>
              {extracting === "image" && (
                <div className="h-1.5 w-32 overflow-hidden rounded-full border-[1.5px] border-black bg-white">
                  <div
                    className="h-full bg-black transition-all"
                    style={{ width: `${Math.round(ocrProgress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {extractError && (
          <p className="mt-1.5 text-[10px] font-semibold text-red-600">{extractError}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.pdf,.jpg,.jpeg,.png,text/plain,text/csv,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={extracting !== null}
            className="text-[10px] font-bold underline decoration-dotted underline-offset-2 hover:decoration-solid disabled:opacity-40"
          >
            …ou choisir un fichier
          </button>
          <ComicButton onClick={onAnalyze} disabled={!rawText.trim() || extracting !== null}>
            Analyser
          </ComicButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {parsedLines === null && (
          <p className="text-[11px] font-semibold leading-relaxed text-black/50">
            Collez ou déposez la liste de matériel du loueur, puis cliquez sur « Analyser » pour
            détecter automatiquement le matériel reconnu et générer la check-list d&apos;essai
            caméra correspondante.
          </p>
        )}

        {parsedLines !== null && (
          <>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
              {matched.length} appareil{matched.length > 1 ? "s" : ""} reconnu
              {matched.length > 1 ? "s" : ""}
            </p>
            <div className="mb-4 flex flex-col gap-1.5">
              {matched.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-lg border-[2px] border-black bg-white px-2.5 py-1.5 text-xs font-bold shadow-comic-sm"
                >
                  <span className="truncate">
                    {l.quantity > 1 ? `${l.quantity}× ` : ""}
                    {l.rule!.label}
                  </span>
                  <span className="shrink-0 rounded-sm bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    {CATEGORY_LABELS[l.rule!.category]}
                  </span>
                </div>
              ))}
              {matched.length === 0 && (
                <p className="text-[11px] font-semibold text-black/40">Aucun appareil reconnu pour l’instant.</p>
              )}
            </div>

            {unmatched.length > 0 && (
              <>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
                  {unmatched.length} ligne{unmatched.length > 1 ? "s" : ""} non reconnue
                  {unmatched.length > 1 ? "s" : ""}
                </p>
                <div className="mb-4 flex flex-col gap-1.5">
                  {unmatched.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-lg border-[2px] border-black/30 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <div className="mb-1 truncate font-bold">
                        {l.quantity > 1 ? `${l.quantity}× ` : ""}
                        {l.raw}
                      </div>
                      <select
                        value={l.manualCategory ?? ""}
                        onChange={(e) =>
                          onUpdateLine(l.id, {
                            manualCategory: (e.target.value || null) as EquipCategory | null,
                          })
                        }
                        className="w-full rounded-md border-[1.5px] border-black/40 bg-white px-1.5 py-1 text-[10px] font-semibold outline-none"
                      >
                        <option value="">Ignorer cette ligne</option>
                        {CATEGORY_ORDER.map((cat) => (
                          <option key={cat} value={cat}>
                            Classer comme « {CATEGORY_LABELS[cat]} »
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            )}

            <ComicButton onClick={onGenerate} variant="solid">
              Générer la check-list
            </ComicButton>
          </>
        )}
      </div>

      <div className="border-t-[3px] border-black p-3 text-[10px] font-semibold leading-relaxed text-black/60">
        Formats supportés : texte collé, .txt, .csv, .pdf (avec texte) et photos/scans .jpg / .png
        (OCR dans le navigateur). Relisez toujours le texte extrait avant d&apos;analyser : l&apos;OCR
        peut se tromper sur une photo floue ou un tableau complexe.
      </div>
    </aside>
  );
}
