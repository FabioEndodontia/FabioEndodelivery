import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#0078D4", "#107C10", "#7719AA", "#FFB900", "#D83B01", "#00B7C3"];

// Função auxiliar para obter as iniciais do nome
function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export default function Reports() {
  const [period, setPeriod] = useState("month");
  const [selectedDentist, setSelectedDentist] = useState("all");
  
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const { data: topDentists = [], isLoading: topDentistsLoading } = useQuery({
    queryKey: ["/api/stats/top-dentists"],
  });
  
  // Calculate treatment types data for pie chart
  const getTypeData = () => {
    const treatment = treatments.filter((t: any) => t.procedureType === "treatment").length;
    const retreatment = treatments.filter((t: any) => t.procedureType === "retreatment").length;
    
    return [
      { name: "Tratamento", value: treatment },
      { name: "Retratamento", value: retreatment }
    ];
  };
  
  // Get tooth distribution data
  const getToothData = () => {
    const toothCount: Record<string, number> = {};
    
    treatments.forEach((treatment: any) => {
      const tooth = treatment.toothNumber;
      toothCount[tooth] = (toothCount[tooth] || 0) + 1;
    });
    
    // Sort by count and get top 10
    return Object.entries(toothCount)
      .map(([tooth, count]) => ({ tooth, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };
  
  const getDentistData = () => {
    return topDentists.map((item: any) => ({
      name: item.dentist.name,
      value: item.treatmentCount
    }));
  };
  
  // Função para obter detalhes de um dentista pelo ID
  const getDentistById = (id: number) => {
    if (!topDentists || !topDentists.length) return null;
    const dentistItem = topDentists.find((item: any) => item.dentist.id === id);
    return dentistItem ? dentistItem.dentist : null;
  };
  
  // Função para obter estatísticas de um dentista
  const getDentistStats = (id: number) => {
    if (!treatments || !treatments.length) {
      return { count: 0, totalValue: 0, averageValue: 0 };
    }
    
    const dentistTreatments = treatments.filter((t: any) => t.dentistId === id);
    const count = dentistTreatments.length;
    const totalValue = dentistTreatments.reduce((sum: number, t: any) => sum + parseFloat(t.value), 0);
    const averageValue = count > 0 ? totalValue / count : 0;
    
    return { count, totalValue, averageValue };
  };
  
  // Função para obter dados mensais para um dentista
  const getMonthlyDataForDentist = (id: number) => {
    if (!treatments || !treatments.length) return [];
    
    const dentistTreatments = treatments.filter((t: any) => t.dentistId === id);
    const monthlyData: Record<string, { month: string, count: number, value: number }> = {};
    
    // Inicializar últimos 6 meses
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = addMonths(today, -i);
      const monthStr = format(monthDate, 'MMM', { locale: ptBR });
      monthlyData[monthStr] = { month: monthStr, count: 0, value: 0 };
    }
    
    // Preencher com dados reais
    dentistTreatments.forEach((t: any) => {
      if (!t.procedureDate) return;
      
      const treatmentDate = new Date(t.procedureDate);
      const monthStr = format(treatmentDate, 'MMM', { locale: ptBR });
      
      // Verificar se é dos últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthDate = addMonths(today, -i);
        if (treatmentDate.getMonth() === monthDate.getMonth() && 
            treatmentDate.getFullYear() === monthDate.getFullYear()) {
          if (!monthlyData[monthStr]) {
            monthlyData[monthStr] = { month: monthStr, count: 0, value: 0 };
          }
          monthlyData[monthStr].count += 1;
          monthlyData[monthStr].value += parseFloat(t.value);
          break;
        }
      }
    });
    
    return Object.values(monthlyData);
  };
  
  // Função para exportar relatório por dentista
  const handleExportDentistReport = () => {
    // Implementação futura para exportação de relatórios
    alert("Funcionalidade de exportação será implementada em breve!");
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <i className="ri-download-line mr-2"></i> Exportar
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="clinical">Procedimentos</TabsTrigger>
          <TabsTrigger value="dentists">Por Dentista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Total de Atendimentos</p>
                    <p className="text-2xl font-semibold">{treatments.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
                    <i className="ri-stethoscope-line text-xl"></i>
                  </div>
                </div>
                <div className="mt-2 text-xs text-success">
                  {period === "month" ? "Neste mês" : period === "quarter" ? "Neste trimestre" : "Neste ano"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Média por Dia</p>
                    <p className="text-2xl font-semibold">
                      {Math.round((treatments.length / 30) * 10) / 10}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <i className="ri-calendar-line text-xl"></i>
                  </div>
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  Baseado nos últimos 30 dias
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Total de Valor</p>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(treatments.reduce((sum: number, t: any) => sum + parseFloat(t.value), 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <i className="ri-money-dollar-circle-line text-xl"></i>
                  </div>
                </div>
                <div className="mt-2 text-xs text-success">
                  Total geral
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribuição por Clínica</CardTitle>
              </CardHeader>
              <CardContent>
                {topDentistsLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topDentists.map((item: any) => ({
                        name: item.dentist.name.length > 15 
                          ? item.dentist.name.substring(0, 15) + '...' 
                          : item.dentist.name,
                        atendimentos: item.treatmentCount,
                        valor: parseFloat(item.totalValue)
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="atendimentos" name="Atendimentos" fill="#0078D4" />
                      <Bar yAxisId="right" dataKey="valor" name="Valor (R$)" fill="#107C10" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tipo de Tratamento</CardTitle>
              </CardHeader>
              <CardContent>
                {treatmentsLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Faturamento Total</p>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(treatments.reduce((sum: number, t: any) => sum + parseFloat(t.value), 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <i className="ri-money-dollar-circle-line text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Valor Médio</p>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(
                        treatments.length 
                          ? treatments.reduce((sum: number, t: any) => sum + parseFloat(t.value), 0) / treatments.length 
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <i className="ri-line-chart-line text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Notas Fiscais</p>
                    <p className="text-2xl font-semibold">
                      {treatments.filter((t: any) => t.hasInvoice).length} / {treatments.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                    <i className="ri-bill-line text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Principais Clínicas por Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              {topDentistsLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="space-y-4">
                  {topDentists.slice(0, 5).map((item: any) => (
                    <div key={item.dentist.id} className="flex items-center border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(item.dentist.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{item.dentist.name}</p>
                        <p className="text-xs text-neutral-500">{item.treatmentCount} atendimentos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">{formatCurrency(item.totalValue)}</p>
                        <p className="text-xs text-neutral-500">
                          Média: {formatCurrency(item.totalValue / item.treatmentCount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribuição por Dente</CardTitle>
              </CardHeader>
              <CardContent>
                {treatmentsLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getToothData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tooth" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Qtd. Tratamentos" fill="#0078D4" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribuição por Clínica</CardTitle>
              </CardHeader>
              <CardContent>
                {topDentistsLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getDentistData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => {
                          const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                          return `${shortName} ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {getDentistData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Resumo de Procedimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {treatmentsLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Total de Tratamentos</p>
                      <p className="text-xl font-semibold">
                        {treatments.filter((t: any) => t.procedureType === "treatment").length}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Total de Retratamentos</p>
                      <p className="text-xl font-semibold">
                        {treatments.filter((t: any) => t.procedureType === "retreatment").length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Valor Médio de Tratamento</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(
                          treatments.filter((t: any) => t.procedureType === "treatment").length
                            ? treatments
                                .filter((t: any) => t.procedureType === "treatment")
                                .reduce((sum: number, t: any) => sum + parseFloat(t.value), 0) /
                              treatments.filter((t: any) => t.procedureType === "treatment").length
                            : 0
                        )}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Valor Médio de Retratamento</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(
                          treatments.filter((t: any) => t.procedureType === "retreatment").length
                            ? treatments
                                .filter((t: any) => t.procedureType === "retreatment")
                                .reduce((sum: number, t: any) => sum + parseFloat(t.value), 0) /
                              treatments.filter((t: any) => t.procedureType === "retreatment").length
                            : 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dentists" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select
              value={selectedDentist}
              onValueChange={setSelectedDentist}
            >
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Selecione um dentista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Dentistas</SelectItem>
                {!topDentistsLoading && topDentists.map((item: any) => (
                  <SelectItem key={item.dentist.id} value={item.dentist.id.toString()}>
                    {item.dentist.name}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>
            
            <div className="ml-auto">
              <Button variant="outline" onClick={() => handleExportDentistReport()}>
                <Download className="h-4 w-4 mr-2" /> Exportar Relatório
              </Button>
            </div>
          </div>
          
          {selectedDentist !== "all" ? (
            <>
              {!topDentistsLoading && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {getDentistById(parseInt(selectedDentist))?.name || "Dentista"}
                    </CardTitle>
                    <CardDescription>
                      {getDentistById(parseInt(selectedDentist))?.address || ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-neutral-500">Total de Atendimentos</p>
                        <p className="text-xl font-semibold">
                          {getDentistStats(parseInt(selectedDentist)).count}
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-neutral-500">Valor Total</p>
                        <p className="text-xl font-semibold">
                          {formatCurrency(getDentistStats(parseInt(selectedDentist)).totalValue)}
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-neutral-500">Ticket Médio</p>
                        <p className="text-xl font-semibold">
                          {formatCurrency(getDentistStats(parseInt(selectedDentist)).averageValue)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">Procedimentos por Tipo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={[
                                  { 
                                    name: "Tratamentos", 
                                    value: treatments.filter((t: any) => 
                                      t.dentistId === parseInt(selectedDentist) && 
                                      t.procedureType === "treatment"
                                    ).length 
                                  },
                                  { 
                                    name: "Retratamentos", 
                                    value: treatments.filter((t: any) => 
                                      t.dentistId === parseInt(selectedDentist) && 
                                      t.procedureType === "retreatment"
                                    ).length 
                                  }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#0078D4" />
                                <Cell fill="#107C10" />
                              </Pie>
                              <Tooltip formatter={(value) => value} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">Histórico Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                              data={getMonthlyDataForDentist(parseInt(selectedDentist))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="Atendimentos"
                                stroke="#0078D4"
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                name="Valor (R$)"
                                stroke="#107C10"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Lista de Procedimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Dente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!treatmentsLoading && treatments
                          .filter((t: any) => t.dentistId === parseInt(selectedDentist))
                          .map((treatment: any) => (
                            <TableRow key={treatment.id}>
                              <TableCell>{formatShortDate(treatment.procedureDate)}</TableCell>
                              <TableCell>{treatment.patient.name}</TableCell>
                              <TableCell>{treatment.toothNumber}</TableCell>
                              <TableCell>
                                {treatment.procedureType === "treatment" ? "Tratamento" : "Retratamento"}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(treatment.value)}</TableCell>
                            </TableRow>
                          ))}
                        {!treatmentsLoading && treatments.filter((t: any) => t.dentistId === parseInt(selectedDentist)).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhum procedimento encontrado para este dentista.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Comparativo de Dentistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dentista</TableHead>
                          <TableHead>Atendimentos</TableHead>
                          <TableHead>Tratamentos</TableHead>
                          <TableHead>Retratamentos</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!topDentistsLoading && topDentists.map((item: any) => (
                          <TableRow key={item.dentist.id} className="cursor-pointer hover:bg-neutral-50" 
                            onClick={() => setSelectedDentist(String(item.dentist.id))}>
                            <TableCell className="font-medium">{item.dentist.name}</TableCell>
                            <TableCell>{item.treatmentCount}</TableCell>
                            <TableCell>
                              {treatments.filter((t: any) => 
                                t.dentistId === item.dentist.id && 
                                t.procedureType === "treatment"
                              ).length}
                            </TableCell>
                            <TableCell>
                              {treatments.filter((t: any) => 
                                t.dentistId === item.dentist.id && 
                                t.procedureType === "retreatment"
                              ).length}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalValue)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.totalValue / item.treatmentCount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {!topDentistsLoading && topDentists.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              Nenhum dentista encontrado com procedimentos registrados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Top 5 Dentistas por Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topDentists.slice(0, 5).map((item: any) => ({
                          name: item.dentist.name.length > 15 
                            ? item.dentist.name.substring(0, 15) + '...' 
                            : item.dentist.name,
                          atendimentos: item.treatmentCount
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="atendimentos" name="Qtd. Atendimentos" fill="#0078D4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Top 5 Dentistas por Faturamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topDentists.slice(0, 5).map((item: any) => ({
                          name: item.dentist.name.length > 15 
                            ? item.dentist.name.substring(0, 15) + '...' 
                            : item.dentist.name,
                          valor: parseFloat(item.totalValue)
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="valor" name="Valor Total (R$)" fill="#107C10" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
