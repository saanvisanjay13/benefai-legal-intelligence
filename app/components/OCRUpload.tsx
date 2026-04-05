"use client";
import { useCallback, useId, useRef, useState } from "react";

export type OCRExtractedData = {
  full_name: string;
  aadhaar_number: string;
  phone: string;
  annual_income: string;
  address: string;
  district: string;
  state: string;
};

export type OCRUploadProps = {
  onDataExtracted?: (data: OCRExtractedData) => void;
};

export default function OCRUpload({ onDataExtracted }: OCRUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<OCRExtractedData | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") { reject(new Error("Could not read file")); return; }
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(file);
    });

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setExtracted(null);
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    setLoading(true);
    try {
      const imageBase64 = await readFileAsBase64(file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType: file.type }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "OCR failed."); return; }

      const data: OCRExtractedData = {
        full_name:      json.full_name      ? String(json.full_name).trim()                     : "",
        aadhaar_number: json.aadhaar_number ? String(json.aadhaar_number).trim()                : "",
        phone:          json.phone          ? String(json.phone).replace(/[^0-9]/g, "")         : "",
        annual_income:  json.annual_income  ? String(json.annual_income).replace(/[^0-9]/g, "") : "",
        address:        json.address        ? String(json.address).trim()                       : "",
        district:       json.district       ? String(json.district).trim()                      : "",
        state:          json.state          ? String(json.state).trim()                         : "",
      };

      console.log("OCR NORMALIZED DATA:", data);
      setExtracted(data);
      onDataExtracted?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [onDataExtracted]);

  return (
    <div className="flex w-full flex-col gap-4">
      <input ref={inputRef} id={inputId} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={onFileChange} />
      <button type="button" disabled={loading} onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60">
        {loading ? "Reading document..." : "Upload Aadhaar / Income Certificate"}
      </button>
      {loading && (
        <div className="flex items-center gap-3 rounded-lg border bg-zinc-50 px-4 py-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm">Extracting fields with AI...</span>
        </div>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {extracted && !loading && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="mb-3 text-sm font-semibold text-green-900">✅ Extracted — auto-filling form below...</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-xs font-medium uppercase text-green-800">Full Name</dt>     <dd className="text-green-950">{extracted.full_name || "—"}</dd>
            <dt className="text-xs font-medium uppercase text-green-800">Aadhaar</dt>       <dd className="text-green-950">{extracted.aadhaar_number || "—"}</dd>
            <dt className="text-xs font-medium uppercase text-green-800">Annual Income</dt> <dd className="text-green-950">{extracted.annual_income || "—"}</dd>
            <dt className="text-xs font-medium uppercase text-green-800">Address</dt>       <dd className="text-green-950">{extracted.address || "—"}</dd>
            <dt className="text-xs font-medium uppercase text-green-800">District</dt>      <dd className="text-green-950">{extracted.district || "—"}</dd>
            <dt className="text-xs font-medium uppercase text-green-800">State</dt>         <dd className="text-green-950">{extracted.state || "—"}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}