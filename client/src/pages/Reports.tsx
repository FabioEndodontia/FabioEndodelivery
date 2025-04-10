import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Download, 
  Calendar,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

// Color scheme
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

const Reports = () => {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("procedures");

  // Fetch procedures data
  const { data: procedures, isLoading: isLoadingProcedures } = useQuery({
    queryKey: ['/api/procedures'],
  });

  // Fetch dentists data
  const { data: dentists, isLoading: isLoadingDentists } = useQuery({
    queryKey: ['/api/dentists'],
  });

  // Generate report data
  const getFilteredProcedures = () => {
    if (!procedures) return [];
    
    // Filter by period
    const now = new Date();
    return procedures.filter(proc => {
      const procDate = new Date(proc.procedureDate);
      
      if (period === "month") {
        return procDate.getMonth() === now.getMonth() && 
               procDate.getFullYear() === now.getFullYear();
      }
      
      if (period === "year") {
        return procDate.getFullYear() === now.getFullYear();
      }
      
      return true; // "all" period
    });
  };

  const filteredProcedures = getFilteredProcedures();

  // Calculate summary statistics
  const summaryStats = {
    totalProcedures: filteredProcedures.length,
    totalRevenue: filteredProcedures.reduce((sum, proc) => sum + proc.value, 0),
    averageValue: filteredProcedures.length > 0 
      ? filteredProcedures.reduce((sum, proc) => sum + proc.value, 0) / filteredProcedures.length
      : 0,
    treatmentCount: filteredProcedures.filter(p => p.procedureType === "TREATMENT").length,
    retreatmentCount: filteredProcedures.filter(p => p.procedureType === "RETREATMENT").length
  };

  // Data for charts
  const proceduresByDentist = () => {
    if (!filteredProcedures.length || !dentists) return [];
    
    const counts: Record<number, { count: number, value: number, name: string }> = {};
    
    filteredProcedures.forEach(proc => {
      if (!counts[proc.dentistId]) {
        const dentist = dentists.find(d => d.id === proc.dentistId);
        counts[proc.dentistId] = { 
          count: 0, 
          value: 0, 
          name: dentist ? dentist.name : `Dentista ${proc.dentistId}` 
        };
      }
      
      counts[proc.dentistId].count += 1;
      counts[proc.dentistId].value += proc.value;
    });
    
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 dentists
  };

  const proceduresByType = () => {
    if (!filteredProcedures.length) return [];
    
    const counts: Record<string, { count: number, value: number, type: string }> = {};
    
    const typeNames: Record<string, string> = {
      "TREATMENT": "Tratamento",
      "RETREATMENT": "Retratamento",
      "INSTRUMENT_REMOVAL": "Remoção de Instrumento",
      "OTHER": "Outros"
    };
    
    filteredProcedures.forEach(proc => {
      if (!counts[proc.procedureType]) {
        counts[proc.procedureType] = { 
          count: 0, 
          value: 0, 
          type: typeNames[proc.procedureType] || proc.procedureType
        };
      }
      
      counts[proc.procedureType].count += 1;
      counts[proc.procedureType].value += proc.value;
    });
    
    return Object.values(counts);
  };

  const proceduresByMonth = () => {
    if (!filteredProcedures.length) return [];
    
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      return {
        month: d.toLocaleString('pt-BR', { month: 'short' }),
        count: 0,
        value: 0,
        index: i
      };
    });
    
    filteredProcedures.forEach(proc => {
      const procDate = new Date(proc.procedureDate);
      if (procDate.getFullYear() === now.getFullYear()) {
        const monthIndex = procDate.getMonth();
        months[monthIndex].count += 1;
        months[monthIndex].value += proc.value;
      }
    });
    
    // Sort by month index
    return months.sort((a, b) => a.index - b.index);
  };

  // Format custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "value" ? formatCurrency(entry.value) : `${entry.value} procedimentos`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const isLoading = isLoadingProcedures || isLoadingDentists;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Relatórios e Análises</h2>
        
        <div className="flex flex-wrap gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Tipo de Relatório</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="procedures">Procedimentos</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="dentists">Por Dentista</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Período</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Procedimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryStats.totalProcedures}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.treatmentCount} tratamentos, {summaryStats.retreatmentCount} retratamentos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-7 w-28" /> : formatCurrency(summaryStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média por procedimento: {formatCurrency(summaryStats.averageValue)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dentistas Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-7 w-16" /> : 
                Array.from(new Set(filteredProcedures.map(p => p.dentistId))).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {dentists?.length || 0} dentistas cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procedures" className="w-full" value={reportType} onValueChange={setReportType}>
        <TabsList className="mb-4">
          <TabsTrigger value="procedures">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Procedimentos
          </TabsTrigger>
          <TabsTrigger value="financial">
            <LineChart className="h-4 w-4 mr-2" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="dentists">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Por Dentista
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="procedures" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Procedures by Type */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Procedimentos por Tipo</CardTitle>
                <CardDescription>Distribuição dos tipos de procedimentos</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={proceduresByType()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {proceduresByType().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Procedures by Month */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Procedimentos por Mês</CardTitle>
                <CardDescription>Evolução mensal de procedimentos</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={proceduresByMonth()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Procedimentos" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            {/* Revenue by Month */}
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Mês</CardTitle>
                <CardDescription>Evolução mensal de faturamento</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={proceduresByMonth()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="value"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Tipo de Procedimento</CardTitle>
                <CardDescription>Valor gerado por cada tipo de procedimento</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={proceduresByType()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="value" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dentists" className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            {/* Top Dentists by Procedures */}
            <Card>
              <CardHeader>
                <CardTitle>Top Dentistas por Número de Procedimentos</CardTitle>
                <CardDescription>Dentistas que mais encaminharam pacientes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={proceduresByDentist()}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Procedimentos" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Top Dentists by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top Dentistas por Faturamento</CardTitle>
                <CardDescription>Dentistas que geraram mais receita</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={[...proceduresByDentist()].sort((a, b) => b.value - a.value)}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `R$ ${value}`} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="value" fill="hsl(var(--chart-3))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
