import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Check, 
  AlertTriangle, 
  FileText,
  FileDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ProcedureForm from "@/components/forms/procedure-form";
import { formatCurrency, formatDate, getTranslatedProcedureType, getTranslatedPaymentStatus } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const Procedures = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProcedureId, setEditProcedureId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch procedures
  const { data: procedures, isLoading } = useQuery({
    queryKey: ['/api/procedures'],
  });

  // Filter procedures based on search
  const filteredProcedures = procedures?.filter(proc => 
    proc.patientName.toLowerCase().includes(search.toLowerCase()) ||
    proc.dentistName.toLowerCase().includes(search.toLowerCase()) ||
    proc.toothNumber.toString().includes(search)
  );

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await apiRequest('DELETE', `/api/procedures/${deleteConfirmId}`);
      
      queryClient.invalidateQueries({
        queryKey: ['/api/procedures'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard/stats'],
      });
      
      toast({
        title: "Atendimento excluído",
        description: "O atendimento foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o atendimento.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'PAID') {
      return (
        <Badge className="bg-success" variant="secondary">
          <Check className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning" variant="secondary">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar atendimentos..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Dentista/Clínica</TableHead>
                  <TableHead>Dente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures && filteredProcedures.length > 0 ? (
                  filteredProcedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                      <TableCell className="font-medium">{procedure.patientName}</TableCell>
                      <TableCell>{procedure.dentistName}</TableCell>
                      <TableCell>{procedure.toothNumber}</TableCell>
                      <TableCell>{getTranslatedProcedureType(procedure.procedureType)}</TableCell>
                      <TableCell>{formatDate(procedure.procedureDate)}</TableCell>
                      <TableCell>{formatCurrency(procedure.value)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(procedure.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/procedure/${procedure.id}`)}>
                              <FileDown className="h-4 w-4 mr-2" />
                              Relatório
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditProcedureId(procedure.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-error"
                              onClick={() => setDeleteConfirmId(procedure.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      {search ? "Nenhum atendimento encontrado para esta busca." : "Nenhum atendimento registrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Procedure Modal */}
      <Dialog 
        open={showAddModal || editProcedureId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setEditProcedureId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editProcedureId ? "Editar Atendimento" : "Novo Atendimento"}
            </DialogTitle>
          </DialogHeader>
          <ProcedureForm
            procedureId={editProcedureId || undefined}
            onSuccess={() => {
              setShowAddModal(false);
              setEditProcedureId(null);
            }}
            onCancel={() => {
              setShowAddModal(false);
              setEditProcedureId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O atendimento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-error text-error-foreground hover:bg-error/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Procedures;
