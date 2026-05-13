import type { ParsedTable } from "./types";

interface DimItem {
  val: number | string;
  label: string;
  note?: string;
  unit?: string;
}

function decodeKey(
  key: string,
  vervarVals: string[],
  varVal: string,
  turvarVals: string[],
  tahunVals: string[],
  turtahunVals: string[]
): { vervar: string; turvar: string; tahun: string; turtahun: string } | null {
  for (const vv of vervarVals) {
    if (!key.startsWith(vv)) continue;
    const r1 = key.slice(vv.length);
    if (!r1.startsWith(varVal)) continue;
    const r2 = r1.slice(varVal.length);
    for (const tv of turvarVals) {
      if (!r2.startsWith(tv)) continue;
      const r3 = r2.slice(tv.length);
      for (const th of tahunVals) {
        if (!r3.startsWith(th)) continue;
        const r4 = r3.slice(th.length);
        for (const tth of turtahunVals) {
          if (r4 === tth) {
            return { vervar: vv, turvar: tv, tahun: th, turtahun: tth };
          }
        }
      }
    }
  }
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

export function parseDynamic(data: Record<string, unknown>): ParsedTable {
  const varList = (data.var as DimItem[]) ?? [];
  const turvarList = (data.turvar as DimItem[]) ?? [];
  const vervarList = (data.vervar as DimItem[]) ?? [];
  const tahunList = (data.tahun as DimItem[]) ?? [];
  const turtahunList = (data.turtahun as DimItem[]) ?? [];
  const datacontent = (data.datacontent ?? {}) as Record<string, number>;

  const varInfo = varList[0] ?? {};
  const varVal = String(varInfo.val ?? "");
  const labelvervar = (data.labelvervar as string) ?? "Kategori";

  const vervarVals = vervarList.map((v) => String(v.val));
  const turvarVals = turvarList.map((v) => String(v.val));
  const tahunVals = tahunList.map((v) => String(v.val));
  const turtahunVals = turtahunList.map((v) => String(v.val));

  const vervarMap = new Map(vervarList.map((v) => [String(v.val), v.label]));
  const turvarMap = new Map(turvarList.map((v) => [String(v.val), v.label]));
  const tahunMap = new Map(tahunList.map((v) => [String(v.val), v.label]));
  const turtahunMap = new Map(turtahunList.map((v) => [String(v.val), v.label]));

  // Collect all unique column combos (turvar × tahun × turtahun) in order of appearance
  const colKeySet = new Set<string>();
  const colKeys: { turvar: string; tahun: string; turtahun: string }[] = [];
  const rowDataMap = new Map<string, Map<string, number>>();

  for (const [key, value] of Object.entries(datacontent)) {
    const decoded = decodeKey(key, vervarVals, varVal, turvarVals, tahunVals, turtahunVals);
    if (!decoded) continue;

    const colKey = `${decoded.turvar}|${decoded.tahun}|${decoded.turtahun}`;
    if (!colKeySet.has(colKey)) {
      colKeySet.add(colKey);
      colKeys.push({ turvar: decoded.turvar, tahun: decoded.tahun, turtahun: decoded.turtahun });
    }

    if (!rowDataMap.has(decoded.vervar)) rowDataMap.set(decoded.vervar, new Map());
    rowDataMap.get(decoded.vervar)!.set(colKey, value);
  }

  // Sort column keys: by turvar, then by tahun, then by turtahun
  colKeys.sort((a, b) => {
    const tvA = turvarVals.indexOf(a.turvar);
    const tvB = turvarVals.indexOf(b.turvar);
    if (tvA !== tvB) return tvA - tvB;
    const thA = tahunVals.indexOf(a.tahun);
    const thB = tahunVals.indexOf(b.tahun);
    if (thA !== thB) return thA - thB;
    return turtahunVals.indexOf(a.turtahun) - turtahunVals.indexOf(b.turtahun);
  });

  const multiTahun = tahunList.length > 1;
  const multiTurtahun = turtahunList.length > 1;
  const multiTurvar = turvarList.length > 1;

  const columns = [
    labelvervar,
    ...colKeys.map((ck) => {
      const tv = turvarMap.get(ck.turvar) ?? ck.turvar;
      const th = tahunMap.get(ck.tahun) ?? ck.tahun;
      const tth = turtahunMap.get(ck.turtahun) ?? ck.turtahun;

      const parts: string[] = [];
      if (multiTurvar) parts.push(tv);
      if (multiTurtahun) parts.push(tth.trim());
      if (multiTahun) parts.push(th);

      if (parts.length === 0) {
        // Only one combination — show all info
        return `${tv} - ${tth.trim()} ${th}`.trim();
      }
      return parts.join(" - ");
    }),
  ];

  const rows = vervarList.map((v) => {
    const vKey = String(v.val);
    const rowData = rowDataMap.get(vKey) ?? new Map();
    return [
      v.label,
      ...colKeys.map((ck) => {
        const ck_str = `${ck.turvar}|${ck.tahun}|${ck.turtahun}`;
        return rowData.get(ck_str) ?? null;
      }),
    ] as (string | number | null)[];
  });

  const note = varInfo.note ? stripHtml(String(varInfo.note)) : undefined;
  const yearLabel = tahunList[0]?.label;

  return {
    format: "dynamic",
    title: String(varInfo.label ?? "Data BPS"),
    unit: String(varInfo.unit ?? ""),
    note,
    yearLabel,
    columns,
    rows,
  };
}
