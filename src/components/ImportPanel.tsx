"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { CATEGORY_LABELS, CATEGORY_ORDER, EquipCategory } from "@/lib/catalog";
import { detectKind, extractImageText, extractPdfText } from "@/lib/extractFile";
import { extractTextFromFile, ParsedLine } from "@/lib/parse";

function UnmatchedLineRow({
  line,
  onUpdateLine,
  muted,
}: {
  line: ParsedLine;
  onUpdateLine: (id: string, patch: Partial<ParsedLine>) => void;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border-[2px] px-2.5 py-1.5 text-xs ${
        muted ? "border-black/15 bg-black/[0.02]" : "border-black/30 bg-white"
      }`}
    >
      <div className={`mb-1 truncate font-bold ${muted ? "text-black/50" : ""}`}>
        {line.quantity > 1 ? `${line.quantity}× ` : ""}
        {line.raw}
      </div>
      <select
        value={line.manualCategory ?? ""}
        onChange={(e) =>
          onUpdateLine(line.id, {
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
  );
}

export function ImportPanel({
  rawText,
  onRawTextChange,
  onAnalyze,
  parsedLines,
  onUpdateLine,
  onGenerate,
  isMobile = false,
  hasChecklist = false,
}: {
  rawText: string;
  onRawTextChange: (v: string) => void;
  onAnalyze: () => void;
  parsedLines: ParsedLine[] | null;
  onUpdateLine: (id: string, patch: Partial<ParsedLine>) => void;
  onGenerate: () => void;
  /** compact, collapsible layout — full-width instead of a fixed sidebar, drag-and-drop de-emphasized since there's no cursor to drag with */
  isMobile?: boolean;
  /** collapsed by default on mobile when a checklist already exists, so it doesn't hog the screen once you're past the import step */
  hasChecklist?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState<"pdf" | "image" | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => !hasChecklist);
  const fileRef = useRef<HTMLInputElement>(null);
  const hadChecklist = useRef(hasChecklist);

  // auto-collapse the moment a checklist first appears (e.g. right after
  // "Générer la check-list"), not just when mounting with one already saved
  useEffect(() => {
    if (isMobile && hasChecklist && !hadChecklist.current) setExpanded(false);
    hadChecklist.current = hasChecklist;
  }, [isMobile, hasChecklist]);

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
  const toReview = parsedLines?.filter((l) => !l.rule && !l.autoIgnored) ?? [];
  const autoIgnored = parsedLines?.filter((l) => !l.rule && l.autoIgnored) ?? [];

  const collapsed = isMobile && !expanded;

  const summary = parsedLines
    ? `${matched.length} appareil${matched.length > 1 ? "s" : ""} reconnu${matched.length > 1 ? "s" : ""}`
    : "Importer une liste de matériel";

  return (
    <aside
      className={
        isMobile
          ? "no-print flex w-full shrink-0 flex-col border-b-[3px] border-black bg-white"
          : "no-print flex h-full w-60 shrink-0 flex-col border-r-[3px] border-black bg-white"
      }
    >
      <div className={isMobile ? "flex items-center justify-between gap-2 p-3" : "border-b-[3px] border-black p-3"}>
        <p className="font-display text-[11px] font-bold uppercase tracking-wider">
          {isMobile ? summary : "Liste de matériel"}
        </p>
        {isMobile && (
          <ComicButton onClick={() => setExpanded((v) => !v)}>{expanded ? "Réduire" : "Importer"}</ComicButton>
        )}
      </div>

      {!collapsed && (
        <div className={isMobile ? "border-t-[2px] border-black/10 p-3" : "border-b-[3px] border-black p-3"}>
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
              placeholder={
                isMobile
                  ? "Ou collez la liste ici…"
                  : "Collez la liste du loueur ici, ou glissez un fichier .txt / .csv / .pdf / .jpg…\n\nEx.\n1x ARRI Alexa 35\n2x Teradek Bolt 6 TX\nSmallHD Ultra 5"
              }
              rows={isMobile ? 3 : 9}
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
          {isMobile ? (
            <div className="mt-2 flex gap-2">
              <ComicButton onClick={() => fileRef.current?.click()} disabled={extracting !== null} className="flex-1">
                Choisir un fichier
              </ComicButton>
              <ComicButton onClick={onAnalyze} disabled={!rawText.trim() || extracting !== null} variant="solid" className="flex-1">
                Analyser
              </ComicButton>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
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
          )}
        </div>
      )}

      {!collapsed && (
        <div className={isMobile ? "p-3" : "flex-1 overflow-y-auto p-3"}>
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

              {toReview.length > 0 && (
                <>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
                    {toReview.length} ligne{toReview.length > 1 ? "s" : ""} à classer
                  </p>
                  <div className="mb-4 flex flex-col gap-1.5">
                    {toReview.map((l) => (
                      <UnmatchedLineRow key={l.id} line={l} onUpdateLine={onUpdateLine} />
                    ))}
                  </div>
                </>
              )}

              {autoIgnored.length > 0 && (
                <details className="mb-4 rounded-lg border-[2px] border-black/15 p-2">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-black/50">
                    {autoIgnored.length} ligne{autoIgnored.length > 1 ? "s" : ""} ignorée
                    {autoIgnored.length > 1 ? "s" : ""} automatiquement (câbles, plaques, accessoires
                    de montage…)
                  </summary>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {autoIgnored.map((l) => (
                      <UnmatchedLineRow key={l.id} line={l} onUpdateLine={onUpdateLine} muted />
                    ))}
                  </div>
                </details>
              )}

              <ComicButton onClick={onGenerate} variant="solid">
                Générer la check-list
              </ComicButton>
            </>
          )}
        </div>
      )}

      {!isMobile && (
        <div className="border-t-[3px] border-black p-3 text-[10px] font-semibold leading-relaxed text-black/60">
          Formats supportés : texte collé, .txt, .csv, .pdf (avec texte) et photos/scans .jpg / .png
          (OCR dans le navigateur). Relisez toujours le texte extrait avant d&apos;analyser : l&apos;OCR
          peut se tromper sur une photo floue ou un tableau complexe.
        </div>
      )}
    </aside>
  );
}
