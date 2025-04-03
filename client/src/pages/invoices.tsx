import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  FileText, 
  Check,
  XCircle,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const Invoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("month");
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(null);
  const [showIssueInvoiceDialog, setShowIssueInvoiceDialog] = useState(false);
  const [showViewInvoiceDialog, setShowViewInvoiceDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  // Fetch invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/invoices'],
  });

  // Fetch procedures with no invoices for "pending" tab
  const { data: procedures, isLoading: isLoadingProcedures } = useQuery({
    queryKey: ['/api/dashboard/pending-invoices'],
  });

  // Fetch invoice details when viewing one
  const { data: invoiceDetails, isLoading: isLoadingInvoiceDetails } = useQuery({
    queryKey: [selectedInvoiceId ? `/api/invoices/${selectedInvoiceId}` : null],
    enabled: !!selectedInvoiceId,
  });

  // Fetch procedure details when issuing an invoice
  const { data: procedureDetails, isLoading: isLoadingProcedureDetails } = useQuery({
    queryKey: [selectedProcedureId ? `/api/procedures/${selectedProcedureId}` : null],
    enabled: !!selectedProcedureId,
  });

  // Filter invoices based on search, filter, and period
  const filteredInvoices = invoices?.filter(invoice => {
    if (!invoice.procedureDetails) return false;
    
    // Search filter
    const matchesSearch = 
      invoice.procedureDetails.patientName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.procedureDetails.dentistName.toLowerCase().includes(search.toLowerCase()) ||
      (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
    
    // Status filter
    const matchesStatus = 
      filter === "all" || 
      (filter === "issued" && invoice.isIssued) ||
      (filter === "not-issued" && !invoice.isIssued);
    
    // Period filter - for simplicity we'll just check the current month for "month"
    const matchesPeriod = () => {
      if (period === "all") return true;
      
      const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      if (!invoiceDate) return false;
      
      const currentDate = new Date();
      
      if (period === "month") {
        return invoiceDate.getMonth() === currentDate.getMonth() && 
               invoiceDate.getFullYear() === currentDate.getFullYear();
      }
      
      if (period === "year") {
        return invoiceDate.getFullYear() === currentDate.getFullYear();
      }
      
      return true;
    };
    
    return matchesSearch && matchesStatus && matchesPeriod();
  });

  // Handle issuing a new invoice
  const handleIssueInvoice = async () => {
    if (!procedureDetails) return;
    
    try {
      await apiRequest('POST', '/api/invoices', {
        procedureId: procedureDetails.id,
        invoiceValue: procedureDetails.value,
        invoiceDate: new Date().toISOString(),
        invoiceNumber: `NF-${Date.now()}`, // Simplified - normally would get this from fiscal system
        isIssued: true,
      });
      
      toast({
        title: "Nota fiscal emitida",
        description: "A nota fiscal foi emitida com sucesso.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['/api/invoices'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard/pending-invoices'],
      });
      
      setShowIssueInvoiceDialog(false);
      setSelectedProcedureId(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao emitir a nota fiscal.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número, paciente ou dentista..."
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
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="issued">Emitidas</SelectItem>
              <SelectItem value="not-issued">Não Emitidas</SelectItem>
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

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="pending">Pendentes de Emissão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="mt-0">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número da NF</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Dentista/Clínica</TableHead>
                    <TableHead>Data de Emissão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingInvoices ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredInvoices && filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {invoice.procedureDetails?.patientName}
                        </TableCell>
                        <TableCell>{invoice.procedureDetails?.dentistName}</TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatCurrency(invoice.invoiceValue)}</TableCell>
                        <TableCell>
                          {invoice.isIssued ? (
                            <Badge className="bg-success bg-opacity-15 text-success">
                              <Check className="h-3 w-3 mr-1" />
                              Emitida
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning">
                              <XCircle className="h-3 w-3 mr-1" />
                              Não Emitida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceId(invoice.id);
                              setShowViewInvoiceDialog(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        {search ? "Nenhuma nota fiscal encontrada para esta busca." : "Nenhuma nota fiscal registrada."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dentista/Clínica</TableHead>
                    <TableHead>Procedimentos</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProcedures ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : procedures && procedures.length > 0 ? (
                    procedures.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.dentist}</TableCell>
                        <TableCell>{item.count} procedimento{item.count !== 1 ? 's' : ''}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-primary"
                            onClick={() => {
                              // In a real app, we'd need to list all procedures for this dentist
                              // Here we'll simplify and assume one procedure per dentist
                              setSelectedProcedureId(1); // Simplified - normally would show a list to choose from
                              setShowIssueInvoiceDialog(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Emitir Nota
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Não há procedimentos pendentes de emissão de nota fiscal.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issue Invoice Dialog */}
      <Dialog open={showIssueInvoiceDialog} onOpenChange={setShowIssueInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Nota Fiscal</DialogTitle>
            <DialogDescription>
              Confirme os detalhes antes de emitir a nota fiscal.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProcedureDetails ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : procedureDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Paciente</Label>
                  <p className="font-medium">{procedureDetails.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dentista/Clínica</Label>
                  <p className="font-medium">{procedureDetails.dentistName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data do Procedimento</Label>
                  <p>{formatDate(procedureDetails.procedureDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor</Label>
                  <p className="font-medium">{formatCurrency(procedureDetails.value)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-muted-foreground">Número da Nota Fiscal</Label>
                <p className="font-medium">NF-{Date.now()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Número gerado automaticamente pelo sistema
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Procedimento não encontrado.
            </p>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueInvoiceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleIssueInvoice} disabled={isLoadingProcedureDetails || !procedureDetails}>
              Emitir Nota Fiscal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={showViewInvoiceDialog} onOpenChange={setShowViewInvoiceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
          </DialogHeader>
          
          {isLoadingInvoiceDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : invoiceDetails ? (
            <div>
              <Card className="border-2">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">NOTA FISCAL ELETRÔNICA</CardTitle>
                      <CardDescription>Serviços de Endodontia</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">Nº {invoiceDetails.invoiceNumber || "—"}</p>
                      <p className="text-sm">Data: {formatDate(invoiceDetails.invoiceDate)}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">PRESTADOR DE SERVIÇOS</h3>
                        <p className="font-medium">Dra. Maria Silva</p>
                        <p>Endodontista - CRO 12345</p>
                        <p>CPF/CNPJ: 123.456.789-00</p>
                        <p>Endereço: Av. Dentista, 123 - Centro</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">TOMADOR DE SERVIÇOS</h3>
                        <p className="font-medium">{invoiceDetails.procedureDetails?.dentistName}</p>
                        <p>Paciente: {invoiceDetails.procedureDetails?.patientName}</p>
                        <p>Data do atendimento: {formatDate(invoiceDetails.procedureDetails?.procedureDate)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIÇÃO DOS SERVIÇOS</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Dente</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              {invoiceDetails.procedureDetails?.procedureType === "TREATMENT" 
                                ? "Tratamento Endodôntico" 
                                : invoiceDetails.procedureDetails?.procedureType === "RETREATMENT"
                                ? "Retratamento Endodôntico"
                                : "Procedimento Endodôntico"}
                            </TableCell>
                            <TableCell>{invoiceDetails.procedureDetails?.toothNumber}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(invoiceDetails.invoiceValue)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="w-1/3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(invoiceDetails.invoiceValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Impostos:</span>
                          <span>-</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{formatCurrency(invoiceDetails.invoiceValue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t flex justify-between py-4">
                  <p className="text-xs text-muted-foreground">
                    Esta nota fiscal foi emitida em {formatDate(invoiceDetails.invoiceDate)}
                  </p>
                  
                  {invoiceDetails.isIssued ? (
                    <Badge className="bg-success">Nota Fiscal Emitida</Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">Nota Fiscal Não Emitida</Badge>
                  )}
                </CardFooter>
              </Card>
              
              <div className="flex justify-end mt-4 space-x-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Nota fiscal não encontrada.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
