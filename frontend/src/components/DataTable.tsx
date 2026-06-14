import { clsx } from "clsx";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  empty?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  tableClassName?: string;
};

export function DataTable<T>({ columns, rows, loading, empty = "No records", rowKey, onRowClick, className, tableClassName }: Props<T>) {
  return (
    <div className={clsx("card", className || "overflow-hidden")}>
      <table className={clsx("min-w-full divide-y divide-slate-200 text-sm", tableClassName)}>
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={clsx("px-4 py-2 text-left font-medium", c.className)}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading && (
            <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
          )}
          {!loading && (!rows || rows.length === 0) && (
            <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">{empty}</td></tr>
          )}
          {!loading && rows?.map((row) => (
            <tr
              key={rowKey(row)}
              className={clsx(onRowClick && "cursor-pointer hover:bg-slate-50")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c) => (
                <td key={c.key} className={clsx("px-4 py-2 align-middle", c.className)}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
