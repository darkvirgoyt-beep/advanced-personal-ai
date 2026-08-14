import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, LogOut,
  User, Trash2, Download,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const CHART_COLORS = ["oklch(0.65 0.2 280)", "oklch(0.60 0.18 200)", "oklch(0.70 0.18 140)", "oklch(0.70 0.15 60)", "oklch(0.65 0.22 330)", "oklch(0.70 0.2 30)"];

function renderChart(chartType: string, chartData: any) {
  if (!chartData) return <p className="text-xs text-muted-foreground text-center p-4">No valid data</p>;
  const data = Array.isArray(chartData) ? chartData : Object.values(chartData);
  if (!Array.isArray(data) || data.length === 0) return <p className="text-xs text-muted-foreground text-center p-4">No data points</p>;

  const keys = Object.keys(data[0] || {}).filter(k => typeof data[0][k] !== "string");
  const labelKey = Object.keys(data[0] || {}).find(k => typeof data[0][k] === "string") || Object.keys(data[0])[0];

  const tooltipProps = {
    contentStyle: { backgroundColor: "oklch(0.15 0.015 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", fontSize: "12px" },
  };

  const gridProps = { strokeDasharray: "3 3", stroke: "oklch(1 0 0 / 5%)" };
  const axisProps = { stroke: "oklch(0.6 0.02 260)", fontSize: 11 };

  switch (chartType.toLowerCase()) {
    case "bar": case "barchart":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={labelKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Legend fontSize={11} />
            {keys.map((key, i) => <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      );
    case "area": case "areachart":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={labelKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Legend fontSize={11} />
            {keys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    case "pie": case "piechart": {
      const pieData = data.map((d: any) => ({ name: String(Object.values(d)[0]), value: Number(Object.values(d)[1]) || 0 }));
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={{ fontSize: 11 }}>
              {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltipProps} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={labelKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Legend fontSize={11} />
            {keys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
          </LineChart>
        </ResponsiveContainer>
      );
  }
}

export default function ChartsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [viewingChart, setViewingChart] = useState<any>(null);

  const chartsQuery = trpc.charts.list.useQuery(undefined, { enabled: !!user });
  const deleteMutation = trpc.charts.delete.useMutation();
  const utils = trpc.useUtils();

  if (loading || !isAuthenticated) return null;

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      utils.charts.list.invalidate();
      toast.success("Chart deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleDownload = (chart: any) => {
    try {
      const blob = new Blob([chart.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chart.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch { toast.error("Failed to download"); }
  };

  if (viewingChart) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar className="border-r border-border/50 bg-sidebar">
            <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
              <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Nova AI</span>
            </SidebarHeader>
            <SidebarContent className="px-2 py-2">
              <SidebarMenu>
                {navItems.map(item => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={window.location.pathname === item.path}>
                      <button onClick={() => navigate(item.path)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <div className="p-3 border-t border-border/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <User className="w-4 h-4 mr-2" />
                    {user?.name || "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top">
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Sidebar>
          <main className="flex-1 flex flex-col">
            <header className="h-14 border-b border-border/50 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setViewingChart(null)}>← Back</Button>
                <h2 className="font-semibold text-sm">{viewingChart.name}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(viewingChart)}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
              </div>
            </header>
            <div className="flex-1 p-4">
              <Card className="h-full p-4">
                <div className="h-[calc(100%-2rem)]">
                  {renderChart(viewingChart.chartType, JSON.parse(viewingChart.data))}
                </div>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Nova AI</span>
          </SidebarHeader>
          <SidebarContent className="px-2 py-2">
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={window.location.pathname === item.path}>
                    <button onClick={() => navigate(item.path)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {user?.name || "User"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top">
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border/50 flex items-center px-4">
            <h2 className="font-semibold text-sm">Chart Gallery</h2>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto">
              {chartsQuery.data?.charts.length === 0 ? (
                <div className="text-center py-16">
                  <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No charts saved yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask Nova to generate a chart and it will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chartsQuery.data?.charts.map(chart => (
                    <Card key={chart.id} className="p-4 cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">{chart.name}</h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingChart(chart); }}>
                            View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(chart.id); }} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="h-40">
                        {renderChart(chart.chartType, JSON.parse(chart.data))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(chart.createdAt).toLocaleDateString()}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
