import type { ParsedTable } from "@/lib/parsers";

const FORMAT_LABELS: Record<string, string> = {
  dynamic: "Data Dinamis (var/vervar)",
  simdasi: "SIMDASI / Tabel Statis",
  list: "Daftar / List Data",
  unknown: "Format Tidak Dikenal",
};

interface MetaInfoProps {
  table: ParsedTable;
}

export function MetaInfo({ table }: MetaInfoProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2 text-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="font-semibold text-blue-700">Format terdeteksi:</span>{" "}
          <span className="text-blue-900">{FORMAT_LABELS[table.format] ?? table.format}</span>
        </div>
        {table.unit && (
          <div>
            <span className="font-semibold text-blue-700">Satuan:</span>{" "}
            <span className="text-blue-900">{table.unit}</span>
          </div>
        )}
        {table.source && (
          <div>
            <span className="font-semibold text-blue-700">Sumber:</span>{" "}
            <span className="text-blue-900">{table.source}</span>
          </div>
        )}
        {table.subtitle && (
          <div>
            <span className="font-semibold text-blue-700">Info:</span>{" "}
            <span className="text-blue-900">{table.subtitle}</span>
          </div>
        )}
      </div>
      {table.note && (
        <p className="text-xs text-blue-700 border-t border-blue-200 pt-2 mt-1 leading-relaxed">
          <span className="font-semibold">Catatan:</span> {table.note.slice(0, 400)}{table.note.length > 400 ? "…" : ""}
        </p>
      )}
    </div>
  );
}
