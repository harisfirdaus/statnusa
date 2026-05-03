import type { ParsedTable } from "@/lib/parsers";

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
    { key: "FORMAT", value: FORMAT_LABELS[table.format] ?? table.format },
    ...(table.unit     ? [{ key: "SATUAN",  value: table.unit }]     : []),
    ...(table.source   ? [{ key: "SUMBER",  value: table.source }]   : []),
    ...(table.subtitle ? [{ key: "INFO",    value: table.subtitle }] : []),
  ];

  if (fields.length === 0 && !table.note) return null;

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800">
      {fields.map(({ key, value }) => (
        <div key={key} className="flex items-baseline gap-4 px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex-shrink-0 w-20">
            {key}
          </span>
          <span className="text-xs text-neutral-700 dark:text-neutral-300 font-mono">{value}</span>
        </div>
      ))}
      {table.note && (
        <div className="flex items-baseline gap-4 px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex-shrink-0 w-20">
            CATATAN
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {table.note.slice(0, 400)}{table.note.length > 400 ? "…" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
