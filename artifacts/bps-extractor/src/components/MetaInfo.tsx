import type { ParsedTable } from "@/lib/parsers";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const PANEL  = "#0d130d";
const GREEN  = "#22c55e";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

const FORMAT_LABELS: Record<string, string> = {
  dynamic: "dynamic",
  simdasi: "simdasi",
  list:    "list",
  unknown: "unknown",
};

interface MetaInfoProps {
  table: ParsedTable;
}

export function MetaInfo({ table }: MetaInfoProps) {
  const fields: { key: string; value: string }[] = [
    { key: "format", value: FORMAT_LABELS[table.format] ?? table.format },
    ...(table.unit   ? [{ key: "unit",   value: table.unit }]   : []),
    ...(table.source ? [{ key: "source", value: table.source }] : []),
    ...(table.subtitle ? [{ key: "info", value: table.subtitle }] : []),
  ];

  return (
    <div className="p-3 text-xs space-y-1" style={{ background: PANEL, border: `1px solid ${BORDER}`, fontFamily: MONO }}>
      {fields.map(({ key, value }) => (
        <div key={key} className="flex items-baseline gap-1">
          <span style={{ color: DIM }}>{key}=</span>
          <span style={{ color: LIGHT }}>{value}</span>
        </div>
      ))}
      {table.note && (
        <div className="pt-1.5 mt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span style={{ color: DIM }}>note=</span>
          <span style={{ color: LIGHT, opacity: 0.8 }}>
            {table.note.slice(0, 400)}{table.note.length > 400 ? "…" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
