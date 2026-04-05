"use client";

import Papa from "papaparse";
import { useCallback, useId, useState } from "react";

type CsvRow = {
  name: string;
  aadhaar: string;
  annualIncome: string;
  district: string;
  scheme: string;
};

type RowResult = CsvRow & {
  fraudScore: string;
  decision: string;
  error?: string;
};

function normalizeHeaderKey(k: string): string {
  return k.trim().toLowerCase();
}

function pickRow(raw: Record<string, unknown>): CsvRow | null {
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    map[normalizeHeaderKey(k)] =
      v == null ? "" : typeof v === "string" ? v.trim() : String(v);
  }
  const name = map.name ?? "";
  const aadhaar = map.aadhaar ?? "";
  const annualIncome = map.annualincome ?? map["annual income"] ?? "";
  const district = map.district ?? "";
  const scheme = map.scheme ?? "";
  if (!name && !aadhaar && !annualIncome && !district && !scheme) {
    return null;
  }
  return { name, aadhaar, annualIncome, district, scheme };
}

function normalizeDecision(d: string): string {
  return d.trim().toUpperCase();
}

function rowBgClass(decision: string, hasError: boolean): string {
  if (hasError) return "bg-zinc-100 dark:bg-zinc-800/50";
  const d = normalizeDecision(decision);
  if (d === "APPROVED") return "bg-green-50 dark:bg-green-950/30";
  if (d === "REVIEW") return "bg-yellow-50 dark:bg-yellow-950/30";
  if (d === "REJECTED") return "bg-red-50 dark:bg-red-950/30";
  return "bg-zinc-50 dark:bg-zinc-900/40";
}

type VerifyJson = {
  fraudScore?: unknown;
  decision?: unknown;
  data?: { fraudScore?: unknown; decision?: unknown };
};

function extractVerifyFields(json: VerifyJson): {
  fraudScore: string;
  decision: string;
} {
  const nested = json.data;
  const scoreRaw = nested?.fraudScore ?? json.fraudScore ?? "";
  const decisionRaw = nested?.decision ?? json.decision ?? "";
  const fraudScore =
    scoreRaw == null
      ? ""
      : typeof scoreRaw === "number"
        ? String(scoreRaw)
        : String(scoreRaw);
  const decision =
    decisionRaw == null ? "" : String(decisionRaw);
  return { fraudScore, decision };
}

export default function BatchCSV() {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RowResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setResults([]);

    const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>(
      (resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      },
    );

    const rows: CsvRow[] = [];
    for (const r of parsed.data) {
      const row = pickRow(r);
      if (row) rows.push(row);
    }

    if (rows.length === 0) {
      setParseError("No data rows found. Expected columns: name, aadhaar, annualIncome, district, scheme.");
      return;
    }

    setBusy(true);
    const out: RowResult[] = [];

    for (const row of rows) {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            aadhaar: row.aadhaar,
            annualIncome: row.annualIncome,
            district: row.district,
            scheme: row.scheme,
          }),
        });
        const json = (await res.json()) as VerifyJson;
        if (!res.ok) {
          const errMsg =
            typeof (json as { error?: unknown }).error === "string"
              ? (json as { error: string }).error
              : `HTTP ${res.status}`;
          out.push({
            ...row,
            fraudScore: "—",
            decision: "ERROR",
            error: errMsg,
          });
          continue;
        }
        const { fraudScore, decision } = extractVerifyFields(json);
        out.push({
          ...row,
          fraudScore: fraudScore || "—",
          decision: decision || "—",
        });
      } catch (e) {
        out.push({
          ...row,
          fraudScore: "—",
          decision: "ERROR",
          error: e instanceof Error ? e.message : "Request failed",
        });
      }
      setResults([...out]);
    }

    setBusy(false);
  }, []);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      if (!f.name.toLowerCase().endsWith(".csv")) {
        setParseError("Please upload a .csv file.");
        return;
      }
      void processFile(f);
    },
    [processFile],
  );

  const total = results.length;
  const flaggedCount = results.filter((r) => {
    if (r.error) return true;
    const d = normalizeDecision(r.decision);
    return d === "REVIEW" || d === "REJECTED";
  }).length;

  const rejectedRows = results.filter(
    (r) => !r.error && normalizeDecision(r.decision) === "REJECTED",
  );

  const downloadFlagged = useCallback(() => {
    if (rejectedRows.length === 0) return;
    const exportRows = rejectedRows.map((r) => ({
      name: r.name,
      aadhaar: r.aadhaar,
      annualIncome: r.annualIncome,
      district: r.district,
      scheme: r.scheme,
      fraudScore: r.fraudScore,
      decision: r.decision,
    }));
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flagged-rejected.csv";
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
  }, [rejectedRows]);

  const done = !busy && results.length > 0;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <div>
        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={onFile}
          disabled={busy}
        />
        <label
          htmlFor={inputId}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/30 dark:border-zinc-600 dark:bg-zinc-900/40 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20 ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Drop a CSV here or click to upload
          </span>
          <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Columns: name, aadhaar, annualIncome, district, scheme
          </span>
        </label>
      </div>

      {parseError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {parseError}
        </p>
      )}

      {busy && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
          Verifying rows…
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80">
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  Name
                </th>
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  District
                </th>
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  Scheme
                </th>
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  Fraud Score
                </th>
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={`${r.name}-${r.aadhaar}-${i}`}
                  className={`border-b border-zinc-200/80 dark:border-zinc-700/80 ${rowBgClass(r.decision, Boolean(r.error))}`}
                >
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                    {r.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                    {r.district || "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                    {r.scheme || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-200">
                    {r.fraudScore}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {r.error ? `Error: ${r.error}` : r.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {done && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            <p>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Total rows:
              </span>{" "}
              {total}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Flagged (review or rejected):
              </span>{" "}
              {flaggedCount}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={downloadFlagged}
              disabled={rejectedRows.length === 0}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Download Flagged CSV
            </button>
            {rejectedRows.length === 0 && (
              <span className="ml-3 text-xs text-zinc-500 dark:text-zinc-400">
                No rejected rows to export.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
