"use client";

import { useCallback, useId, useRef, useState } from "react";

export type OCRUploadData = {
  name: string;
  aadhaar: string;
  income: string;
  address: string;
  district: string;
  state: string;
};

type OCRUploadProps = {
  onDataExtracted?: (data: OCRUploadData) => void;
};

const DISPLAY_FIELDS: { key: keyof OCRUploadData; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "income", label: "Income" },
  { key: "address", label: "Address" },
  { key: "district", label: "District" },
  { key: "state", label: "State" },
];

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function mapApiToDisplay(raw: Record<string, unknown>): OCRUploadData {
  return {
    name: str(raw.full_name),
    aadhaar: str(raw.aadhaar_number),
    income: str(raw.annual_income),
    address: str(raw.address),
    district: str(raw.district),
    state: str(raw.state),
  };
}

export default function OCRUpload({ onDataExtracted }: OCRUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OCRUploadData | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Could not read file"));
          return;
        }
        const i = result.indexOf(",");
        resolve(i >= 0 ? result.slice(i + 1) : result);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(file);
    });

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      setError(null);
      setData(null);

      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }

      const allowed = new Set([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]);
      if (!allowed.has(file.type)) {
        setError("Use JPEG, PNG, GIF, or WebP.");
        return;
      }

      setLoading(true);
      try {
        const imageBase64 = await readFileAsBase64(file);
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            mediaType: file.type,
          }),
        });
        const json = (await res.json()) as Record<string, unknown>;

        if (json.success !== true) {
          setError(str(json.error) || "OCR request failed.");
          return;
        }

        const mapped = mapApiToDisplay(json);
        setData(mapped);
        onDataExtracted?.(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [onDataExtracted],
  );

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="sr-only"
        onChange={onFileChange}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Upload Aadhaar / Income Certificate
      </button>

      {loading && (
        <p
          className="text-sm text-zinc-600 dark:text-zinc-400"
          role="status"
          aria-live="polite"
        >
          Reading document with AI...
        </p>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="rounded-lg border-2 border-green-600 bg-green-50/80 p-4 dark:border-green-500 dark:bg-green-950/30">
          <p className="mb-3 text-sm font-semibold text-green-900 dark:text-green-100">
            Extracted fields
          </p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr] sm:gap-x-4">
            {DISPLAY_FIELDS.map(({ key, label }) => (
              <div key={key} className="contents">
                <dt className="text-xs font-medium uppercase tracking-wide text-green-800/90 dark:text-green-300/90">
                  {label}
                </dt>
                <dd className="text-sm text-green-950 dark:text-green-50 sm:col-start-2">
                  {data[key] || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
