import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Filter,
  Calendar,
  Search,
  Check,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";

const Financial = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("month");

  // Fetch procedures with financial info
  const { data: procedures, isLoading: isLoadingProcedures } = useQuery({
    queryKey: ['/api/procedures'],
  });

  // Filter procedures based on search and filter criteria
  const filteredProcedures = procedures?.filter(proc => {
    // Search filter
    const matchesSearch = 
      proc.patientName.toLowerCase().includes(search.toLowerCase()) ||
      proc.dentistName.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filter === "all" || 
      (filter === "paid" && proc.paymentStatus === "PAID") ||
      (filter === "pending" && proc.paymentStatus === "PENDING");
    
    // Period filter - for simplicity we'll just check the current month for "month"
    const matchesPeriod = () => {
      if (period === "all") return true;
      
      const procDate = new Date(proc.procedureDate);
      const currentDate = new Date();
      
      if (period === "month") {
        return procDate.getMonth() === currentDate.getMonth() && 
               procDate.getFullYear() === currentDate.getFullYear();
      }
      
      if (period === "year") {
        return procDate.getFullYear() === currentDate.getFullYear();
      }
      
      return true;
    };
    
    return matchesSearch && matchesStatus && matchesPeriod();
  });

  // Calculate financial summary
  const financialSummary = {
    totalRevenue: filteredProcedures?.reduce((sum, proc) => sum + proc.value, 0) || 0,
    paidAmount: filteredProcedures?.filter(p => p.paymentStatus === "PAID")
      .reduce((sum, proc) => sum + proc.value, 0) || 0,
    pendingAmount: filteredProcedures?.filter(p => p.paymentStatus === "PENDING")
      .reduce((sum, proc) => sum + proc.value, 0) || 0,
    totalProcedures: filteredProcedures?.length || 0,
    paidProcedures: filteredProcedures?.filter(p => p.paymentStatus === "PAID").length || 0,
    pendingProcedures: filteredProcedures?.filter(p => p.paymentStatus === "PENDING").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por dentista ou paciente..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Financial Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingProcedures ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                formatCurrency(financialSummary.totalRevenue)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialSummary.totalProcedures} procedimentos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {isLoadingProcedures ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                formatCurrency(financialSummary.paidAmount)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialSummary.paidProcedures} procedimentos pagos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {isLoadingProcedures ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                formatCurrency(financialSummary.pendingAmount)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialSummary.pendingProcedures} procedimentos pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos os Procedimentos</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <FinancialTable 
            procedures={filteredProcedures || []} 
            isLoading={isLoadingProcedures} 
          />
        </TabsContent>
        
        <TabsContent value="paid" className="mt-0">
          <FinancialTable 
            procedures={(filteredProcedures || []).filter(p => p.paymentStatus === "PAID")} 
            isLoading={isLoadingProcedures} 
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <FinancialTable 
            procedures={(filteredProcedures || []).filter(p => p.paymentStatus === "PENDING")} 
            isLoading={isLoadingProcedures} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface FinancialTableProps {
  procedures: any[];
  isLoading: boolean;
}

const FinancialTable: React.FC<FinancialTableProps> = ({ procedures, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Dentista/Clínica</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {procedures.length > 0 ? (
              procedures.map((procedure) => (
                <TableRow key={procedure.id}>
                  <TableCell className="font-medium">{procedure.patientName}</TableCell>
                  <TableCell>{procedure.dentistName}</TableCell>
                  <TableCell>{formatDate(procedure.procedureDate)}</TableCell>
                  <TableCell>{formatCurrency(procedure.value)}</TableCell>
                  <TableCell>
                    {procedure.paymentMethod === "PIX" && "PIX"}
                    {procedure.paymentMethod === "BANK_TRANSFER" && "Transferência"}
                    {procedure.paymentMethod === "CASH" && "Dinheiro"}
                    {procedure.paymentMethod === "CHECK" && "Cheque"}
                    {procedure.paymentMethod === "PENDING" && "A receber"}
                  </TableCell>
                  <TableCell>
                    {procedure.paymentStatus === "PAID" ? (
                      <Badge className="bg-success bg-opacity-15 text-success">
                        <Check className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge className="bg-warning bg-opacity-15 text-warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {procedure.paymentStatus === "PENDING" ? (
                          <DropdownMenuItem>Marcar como pago</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Nenhum procedimento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default Financial;
