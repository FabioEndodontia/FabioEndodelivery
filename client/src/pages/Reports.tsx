import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency, getInitials } from "@/lib/utils";
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
  Cell
} from "recharts";

const COLORS = ["#0078D4", "#107C10", "#7719AA", "#FFB900", "#D83B01", "#00B7C3"];

export default function Reports() {
  const [period, setPeriod] = useState("month");
  
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const { data: topDentists = [], isLoading: topDentistsLoading } = useQuery({
    queryKey: ["/api/stats/top-dentists"],
  });
  
  // Calculate treatment types data for pie chart
  const getTypeData = () => {
    const treatment = treatments.filter((t: any) => t.treatmentType === "treatment").length;
    const retreatment = treatments.filter((t: any) => t.treatmentType === "retreatment").length;
    
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
                        {treatments.filter((t: any) => t.treatmentType === "treatment").length}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Total de Retratamentos</p>
                      <p className="text-xl font-semibold">
                        {treatments.filter((t: any) => t.treatmentType === "retreatment").length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Valor Médio de Tratamento</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(
                          treatments.filter((t: any) => t.treatmentType === "treatment").length
                            ? treatments
                                .filter((t: any) => t.treatmentType === "treatment")
                                .reduce((sum: number, t: any) => sum + parseFloat(t.value), 0) /
                              treatments.filter((t: any) => t.treatmentType === "treatment").length
                            : 0
                        )}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-neutral-50">
                      <p className="text-sm text-neutral-500">Valor Médio de Retratamento</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(
                          treatments.filter((t: any) => t.treatmentType === "retreatment").length
                            ? treatments
                                .filter((t: any) => t.treatmentType === "retreatment")
                                .reduce((sum: number, t: any) => sum + parseFloat(t.value), 0) /
                              treatments.filter((t: any) => t.treatmentType === "retreatment").length
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
      </Tabs>
    </>
  );
}
