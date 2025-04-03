import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import NewTreatmentDialog from "@/components/NewTreatmentDialog";

export default function Treatments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [filterDentist, setFilterDentist] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const { data: dentists = [] } = useQuery({
    queryKey: ["/api/dentists"],
  });
  
  const deleteTreatment = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/treatments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/financial"] });
      toast({
        title: "Sucesso",
        description: "Atendimento excluído com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir atendimento: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteTreatment = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este atendimento?")) {
      deleteTreatment.mutate(id);
    }
  };
  
  // Filter treatments based on selected filters
  const filteredTreatments = treatments.filter((treatment: any) => {
    let matches = true;
    
    if (filterDentist !== "all") {
      matches = matches && treatment.dentistId === parseInt(filterDentist);
    }
    
    if (filterStatus !== "all") {
      matches = matches && treatment.paymentStatus === filterStatus;
    }
    
    return matches;
  });
  
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
  
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "transfer_pix":
        return "Transferência/PIX";
      case "cash":
        return "Dinheiro";
      case "credit_card":
        return "Cartão de Crédito";
      case "pending":
        return "Pendente";
      default:
        return method;
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
      accessorKey: "procedure",
      header: "Procedimento",
      cell: (treatment: any) => (
        <span className="inline-flex items-center">
          {treatment.treatmentType === "treatment" ? "Tratamento" : "Retratamento"}{" "}
          <span className="ml-1 text-xs bg-primary-50 text-primary-700 rounded px-1">
            Dente {treatment.toothNumber}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "treatmentDate",
      header: "Data",
      cell: (treatment: any) => <span>{formatDate(treatment.treatmentDate)}</span>,
    },
    {
      accessorKey: "value",
      header: "Valor",
      cell: (treatment: any) => <span className="font-medium">{formatCurrency(treatment.value)}</span>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Forma de Pagamento",
      cell: (treatment: any) => <span>{getPaymentMethodText(treatment.paymentMethod)}</span>,
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
    {
      accessorKey: "actions",
      header: "Ações",
      cell: (treatment: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTreatment(treatment.id);
            }}
          >
            <i className="ri-delete-bin-line"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Atendimentos</h1>
        <Button onClick={() => setTreatmentDialogOpen(true)}>
          <i className="ri-stethoscope-line mr-2"></i> Novo Atendimento
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Dentista/Clínica</label>
            <Select value={filterDentist} onValueChange={setFilterDentist}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os dentistas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dentistas</SelectItem>
                {dentists.map((dentist: any) => (
                  <SelectItem key={dentist.id} value={dentist.id.toString()}>
                    {dentist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="late">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : (
          <DataTable
            data={filteredTreatments}
            columns={columns}
            searchable
            searchKey="patient.name"
          />
        )}
      </div>
      
      <NewTreatmentDialog
        open={treatmentDialogOpen}
        onOpenChange={setTreatmentDialogOpen}
      />
    </>
  );
}
