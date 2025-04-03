import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  DollarSign, 
  Users, 
  Receipt, 
  Plus, 
  BarChart,
  TrendingUp,
  ChevronRight,
  Calendar,
  FileText,
  ArrowUpRight,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import StatCard from "@/components/stat-card";
import ProcedureList from "@/components/procedure-list";
import PendingPayments from "@/components/pending-payments";
import PendingInvoices from "@/components/pending-invoices";
import ProcedureForm from "@/components/forms/procedure-form";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Cores para gráficos
const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7"];

const Dashboard = () => {
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch recent procedures
  const { data: recentProcedures, isLoading: isLoadingProcedures } = useQuery({
    queryKey: ['/api/dashboard/recent-procedures'],
  });

  // Fetch pending payments
  const { data: pendingPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/dashboard/pending-payments'],
  });

  // Fetch pending invoices
  const { data: pendingInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/dashboard/pending-invoices'],
  });

  // Fetch procedures by type for charts
  const { data: proceduresByType, isLoading: isLoadingProceduresByType } = useQuery({
    queryKey: ['/api/dashboard/stats/procedures-by-type'],
  });

  // Fetch procedures by complexity for charts
  const { data: proceduresByComplexity, isLoading: isLoadingComplexity } = useQuery({
    queryKey: ['/api/dashboard/stats/procedures-by-complexity'],
  });

  // Fetch dentist performance
  const { data: dentistPerformance, isLoading: isLoadingDentistPerformance } = useQuery({
    queryKey: ['/api/dashboard/stats/dentist-performance'],
  });

  // Fetch revenue by month
  const { data: revenueByMonth, isLoading: isLoadingRevenueByMonth } = useQuery({
    queryKey: ['/api/dashboard/stats/revenue-by-month'],
  });

  // Fetch monthly comparison
  const { data: monthlyComparison, isLoading: isLoadingMonthlyComparison } = useQuery({
    queryKey: ['/api/dashboard/stats/monthly-comparison'],
  });

  // Preparar dados para os gráficos
  const formatProcedureTypeData = () => {
    if (!proceduresByType) return [];
    return proceduresByType.map(item => ({
      name: formatProcedureTypeName(item.type),
      value: item.count,
      percentage: Math.round(item.percentage)
    }));
  };

  const formatProcedureTypeName = (type) => {
    const typeMap = {
      'treatment': 'Tratamento',
      'retreatment': 'Retratamento',
      'instrument_removal': 'Remoção de Instrumento',
      'other': 'Outro'
    };
    return typeMap[type] || type;
  };

  const formatComplexityData = () => {
    if (!proceduresByComplexity) return [];
    return proceduresByComplexity.map(item => ({
      name: formatComplexityName(item.complexity),
      value: item.count,
      percentage: Math.round(item.percentage)
    }));
  };

  const formatComplexityName = (complexity) => {
    const complexityMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'unknown': 'Não especificada'
    };
    return complexityMap[complexity] || complexity;
  };

  const formatDentistPerformanceData = () => {
    if (!dentistPerformance) return [];
    // Pegar os top 5 dentistas por receita
    return dentistPerformance
      .slice(0, 5)
      .map(item => ({
        name: item.dentistName,
        procedures: item.procedureCount,
        revenue: item.revenue
      }));
  };

  // Calcular as tendências com base nas comparações mensais
  const getTrend = (index, defaultValue = "0%") => {
    if (!monthlyComparison || !monthlyComparison[index]) return {
      value: defaultValue,
      isPositive: true
    };
    
    const comparison = monthlyComparison[index];
    const percentChange = comparison.percentageChange.toFixed(1);
    
    return {
      value: `${Math.abs(percentChange)}% desde mês passado`,
      isPositive: percentChange >= 0
    };
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Análise Avançada</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Atendimentos este mês"
              value={isLoadingStats ? "-" : stats?.monthlyProcedures}
              icon={<Activity className="h-6 w-6 text-primary" />}
              trend={getTrend(0, "12.5% desde mês passado")}
            />
            
            <StatCard
              title="Faturamento este mês"
              value={isLoadingStats ? "-" : formatCurrency(stats?.monthlyRevenue || 0)}
              icon={<DollarSign className="h-6 w-6 text-secondary" />}
              iconClassName="bg-secondary bg-opacity-10"
              trend={getTrend(1, "8.3% desde mês passado")}
            />
            
            <StatCard
              title="Clínicas parceiras ativas"
              value={isLoadingStats ? "-" : stats?.activeDentists}
              icon={<Users className="h-6 w-6 text-accent" />}
              iconClassName="bg-accent bg-opacity-10"
              trend={{
                value: "2 novos este mês",
                isPositive: true
              }}
            />
            
            <StatCard
              title="Recebimentos pendentes"
              value={isLoadingStats ? "-" : formatCurrency(stats?.pendingPaymentsValue || 0)}
              icon={<Receipt className="h-6 w-6 text-warning" />}
              iconClassName="bg-warning bg-opacity-10"
              trend={{
                value: `${stats?.pendingPayments || 0} pendentes`,
                isPositive: false
              }}
            />
          </div>

          {/* Recent Activity / Upcoming Procedures */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold">Atendimentos Recentes</h3>
                  <Button variant="link" className="text-sm text-primary p-0 h-auto">
                    Ver todos
                  </Button>
                </div>
                
                <ProcedureList
                  procedures={recentProcedures || []}
                  isLoading={isLoadingProcedures}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <PendingPayments
                payments={pendingPayments || []}
                isLoading={isLoadingPayments}
              />
              
              <PendingInvoices
                invoices={pendingInvoices || []}
                isLoading={isLoadingInvoices}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Receita Mensal */}
            <Card className="col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Receita Mensal</CardTitle>
                <CardDescription>Desempenho financeiro nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRevenueByMonth ? (
                  <div className="h-64 flex items-center justify-center">Carregando dados...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
                      <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "Receita"]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Receita" 
                        stroke="#0088FE" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Tipo de Procedimento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Tipos de Procedimentos</CardTitle>
                <CardDescription>Distribuição por tipo de atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProceduresByType ? (
                  <div className="h-64 flex items-center justify-center">Carregando dados...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={formatProcedureTypeData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {formatProcedureTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Quantidade"]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Complexidade */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Complexidade</CardTitle>
                <CardDescription>Distribuição por nível de complexidade</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingComplexity ? (
                  <div className="h-64 flex items-center justify-center">Carregando dados...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={formatComplexityData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {formatComplexityData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Quantidade"]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Desempenho por Dentista */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Top Dentistas</CardTitle>
                <CardDescription>Principais parceiros por receita</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDentistPerformance ? (
                  <div className="h-64 flex items-center justify-center">Carregando dados...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart
                      layout="vertical"
                      data={formatDentistPerformanceData()}
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip
                        formatter={(value, name) => {
                          return name === "revenue" 
                            ? [formatCurrency(value), "Receita"] 
                            : [value, "Procedimentos"];
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Receita" 
                        fill="#0088FE" 
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {isLoadingStats ? "..." : stats?.totalProcedures}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tratamentos: {isLoadingStats ? "..." : stats?.totalTreatments}, 
                  Retratamentos: {isLoadingStats ? "..." : stats?.totalRetreatments}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Valor Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {isLoadingStats ? "..." : formatCurrency(stats?.averageValue || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Por procedimento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {isLoadingStats ? "..." : formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Acumulada desde o início
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Add Button */}
      <Button
        className="fixed right-6 bottom-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowProcedureModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* New Procedure Modal */}
      <Dialog open={showProcedureModal} onOpenChange={setShowProcedureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Atendimento</DialogTitle>
          </DialogHeader>
          <ProcedureForm
            onSuccess={() => setShowProcedureModal(false)}
            onCancel={() => setShowProcedureModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
