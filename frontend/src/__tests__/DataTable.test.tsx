import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type Column } from "../src/components/DataTable";

type Row = { id: string; name: string };
const cols: Column<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
];

describe("DataTable", () => {
  it("renders empty state", () => {
    render(<DataTable rows={[]} columns={cols} rowKey={(r) => r.id} />);
    expect(screen.getByText(/no records/i)).toBeInTheDocument();
  });
  it("renders rows", () => {
    render(<DataTable rows={[{ id: "1", name: "Alpha" }]} columns={cols} rowKey={(r) => r.id} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
