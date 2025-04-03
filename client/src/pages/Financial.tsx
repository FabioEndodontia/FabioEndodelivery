import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

export default function Financial() {
  const [period, setPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const { data: financialStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/financial"],
  });
  
  // Filter treatments based on payment status
  const filteredTreatments = treatments.filter((treatment: any) => {
    if (filterStatus === "all") return true;
    return treatment.paymentStatus === filterStatus;
  });
  
  // Prepare data for pie chart
  const paymentMethodData = [
    { name: "Transferência/PIX", value: financialStats?.paymentMethodBreakdown.transfer_pix || 0 },
    { name: "Dinheiro", value: financialStats?.paymentMethodBreakdown.cash || 0 },
    { name: "Cartão de Crédito", value: financialStats?.paymentMethodBreakdown.credit_card || 0 },
    { name: "Pendente", value: financialStats?.paymentMethodBreakdown.pending || 0 }
  ].filter(item => item.value > 0);
  
  const COLORS = ["#0078D4", "#107C10", "#7719AA", "#FFB900"];
  
  // Calculate total values
  const totalReceived = financialStats?.totalReceived || 0;
  const totalPending = financialStats?.totalPending || 0;
  const totalLate = financialStats?.totalLate || 0;
  const total = totalReceived + totalPending + totalLate;
  
  // Calculate percentages
  const receivedPercentage = total > 0 ? Math.round((totalReceived / total) * 100) : 0;
  const pendingPercentage = total > 0 ? Math.round((totalPending / total) * 100) : 0;
  const latePercentage = total > 0 ? Math.round((totalLate / total) * 100) : 0;
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "late":
        return "bg-error/10 text-error";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "late":
        return "Atrasado";
      default:
        return status;
    }
  };
  
  const columns = [
    {
      accessorKey: "patient",
      header: "Paciente",
      cell: (treatment: any) => (
        <div className="flex items-center">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarFallback className="text-xs font-semibold">
              {getInitials(treatment.patient.name)}
            </AvatarFallback>
          </Avatar>
          <span>{treatment.patient.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "dentist",
      header: "Dentista/Clínica",
      cell: (treatment: any) => <span>{treatment.dentist.name}</span>,
    },
    {
      accessorKey: "value",
      header: "Valor",
      cell: (treatment: any) => <span className="font-medium">{formatCurrency(treatment.value)}</span>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Forma de Pagamento",
      cell: (treatment: any) => {
        switch (treatment.paymentMethod) {
          case "transfer_pix":
            return "Transferência/PIX";
          case "cash":
            return "Dinheiro";
          case "credit_card":
            return "Cartão de Crédito";
          case "pending":
            return "Pendente";
          default:
            return treatment.paymentMethod;
        }
      },
    },
    {
      accessorKey: "paidBy",
      header: "Pago Por",
      cell: (treatment: any) => (
        treatment.paidBy === "dentist" ? "Dentista/Clínica" : "Paciente"
      ),
    },
    {
      accessorKey: "hasInvoice",
      header: "Nota Fiscal",
      cell: (treatment: any) => (
        treatment.hasInvoice ? (
          <span className="inline-flex items-center text-success">
            <i className="ri-check-line mr-1"></i> Emitida
          </span>
        ) : (
          <span className="text-neutral-500">Não emitida</span>
        )
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: (treatment: any) => (
        <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeClass(treatment.paymentStatus)}`}>
          {getStatusText(treatment.paymentStatus)}
        </span>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <i className="ri-download-line mr-2"></i> Exportar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-neutral-500 text-sm">Recebido</p>
                <p className="text-2xl font-semibold text-success">
                  {formatCurrency(totalReceived)}
                </p>
              </div>
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center text-success">
                <i className="ri-money-dollar-circle-line text-xl"></i>
              </div>
            </div>
            <Progress value={receivedPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-success" />
            <p className="text-xs text-neutral-500 mt-1">{receivedPercentage}% do total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-neutral-500 text-sm">Pendente</p>
                <p className="text-2xl font-semibold text-warning">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center text-warning">
                <i className="ri-time-line text-xl"></i>
              </div>
            </div>
            <Progress value={pendingPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-warning" />
            <p className="text-xs text-neutral-500 mt-1">{pendingPercentage}% do total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-neutral-500 text-sm">Atrasado</p>
                <p className="text-2xl font-semibold text-error">
                  {formatCurrency(totalLate)}
                </p>
              </div>
              <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center text-error">
                <i className="ri-error-warning-line text-xl"></i>
              </div>
            </div>
            <Progress value={latePercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-error" />
            <p className="text-xs text-neutral-500 mt-1">{latePercentage}% do total</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumo de Notas Fiscais</CardTitle>
          </CardHeader>
          <CardContent>
            {treatmentsLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total com Nota Fiscal</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(treatments.reduce((sum: number, t: any) => t.hasInvoice ? sum + parseFloat(t.value) : sum, 0))}
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-neutral-50">
                  <p className="text-sm text-neutral-500">Total sem Nota Fiscal</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(treatments.reduce((sum: number, t: any) => !t.hasInvoice ? sum + parseFloat(t.value) : sum, 0))}
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-primary-50">
                  <p className="text-sm text-primary-700">Valor Total das Notas</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(treatments.reduce((sum: number, t: any) => t.hasInvoice && t.invoiceValue ? sum + parseFloat(t.invoiceValue) : sum, 0))}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="late">Atrasados</TabsTrigger>
          </TabsList>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="late">Atrasados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="all" className="bg-white rounded-lg shadow-sm p-6">
          {treatmentsLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <DataTable
              data={filteredTreatments}
              columns={columns}
              searchable
              searchKey="patient.name"
            />
          )}
        </TabsContent>
        
        <TabsContent value="paid" className="bg-white rounded-lg shadow-sm p-6">
          {treatmentsLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <DataTable
              data={treatments.filter((t: any) => t.paymentStatus === "paid")}
              columns={columns}
              searchable
              searchKey="patient.name"
            />
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="bg-white rounded-lg shadow-sm p-6">
          {treatmentsLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <DataTable
              data={treatments.filter((t: any) => t.paymentStatus === "pending")}
              columns={columns}
              searchable
              searchKey="patient.name"
            />
          )}
        </TabsContent>
        
        <TabsContent value="late" className="bg-white rounded-lg shadow-sm p-6">
          {treatmentsLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <DataTable
              data={treatments.filter((t: any) => t.paymentStatus === "late")}
              columns={columns}
              searchable
              searchKey="patient.name"
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
