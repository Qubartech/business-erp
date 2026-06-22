"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { usersApi } from "@/services/api";
import type { User } from "@/types";
import { formatDate } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function UsersListPage() {
  const router = useRouter(); const nav = (path: any) => { if (path === -1) router.back(); else router.push(path); };
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list({ search: search || undefined, pageSize: 50 }),
  });
  const toggle = useMutation({
    mutationFn: (u: User) => usersApi.setActive(u.id, !u.isActive),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  const cols: Column<User>[] = [
    { key: "name", header: "Name", render: (u) => <span className="font-medium text-slate-900">{u.name}</span> },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "role", header: "Role", render: (u) => <span className="badge bg-slate-50 text-slate-700 ring-slate-200">{u.role}</span> },
    { key: "active", header: "Status", render: (u) => (
      <span className={u.isActive ? "badge bg-emerald-50 text-emerald-700 ring-emerald-200" : "badge bg-slate-100 text-slate-500 ring-slate-200"}>
        {u.isActive ? "active" : "inactive"}
      </span>
    )},
    { key: "created", header: "Created", render: (u) => formatDate(u.createdAt) },
    { key: "actions", header: "", render: (u) => {
      const isPendingThisUser = toggle.isPending && toggle.variables?.id === u.id;
      return (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn-secondary" disabled={isPendingThisUser} onClick={() => nav(`/users/${u.id}`)}>Edit</button>
          <button className="btn-secondary" disabled={isPendingThisUser} onClick={() => toggle.mutate(u)}>
            {isPendingThisUser && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
            {u.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      );
    }, className: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Users" description="Manage team members and roles"
        actions={<button className="btn-primary" onClick={() => nav("/users/new")}>New user</button>} />
      <div className="mb-3">
        <input className="input w-full md:max-w-sm" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(u) => u.id} onRowClick={(u) => nav(`/users/${u.id}`)} />
    </>
  );
}
