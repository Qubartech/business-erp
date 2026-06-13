import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { dashboardApi } from "@/services/featureApis";

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });
  return (
    <>
      <PageHeader title="Dashboard" description="Overview at a glance" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card label="Total projects" value={isLoading ? "…" : data?.totalProjects ?? 0} />
        <Card label="Active projects" value={isLoading ? "…" : data?.activeProjects ?? 0} />
        <Card label="Total tasks" value={isLoading ? "…" : data?.totalTasks ?? 0} />
        <Card label="Completed tasks" value={isLoading ? "…" : data?.completedTasks ?? 0} />
        <Card label="Team members" value={isLoading ? "…" : data?.teamMembers ?? 0} />
      </div>
    </>
  );
}
