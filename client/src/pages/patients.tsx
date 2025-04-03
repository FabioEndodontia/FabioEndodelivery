import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Mail, 
  Phone, 
  FileText 
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
import PatientForm from "@/components/forms/patient-form";
import { apiRequest } from "@/lib/queryClient";

const Patients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPatientId, setEditPatientId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Filter patients based on search
  const filteredPatients = patients?.filter(patient => 
    patient.name.toLowerCase().includes(search.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(search.toLowerCase())) ||
    (patient.phone && patient.phone.includes(search))
  );

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await apiRequest('DELETE', `/api/patients/${deleteConfirmId}`);
      
      queryClient.invalidateQueries({
        queryKey: ['/api/patients'],
      });
      
      toast({
        title: "Paciente excluído",
        description: "O paciente foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o paciente.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pacientes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>
                        {patient.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {patient.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {patient.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{patient.notes}</TableCell>
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
                            <DropdownMenuItem onClick={() => setEditPatientId(patient.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-error"
                              onClick={() => setDeleteConfirmId(patient.id)}
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
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {search ? "Nenhum paciente encontrado para esta busca." : "Nenhum paciente registrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Patient Modal */}
      <Dialog 
        open={showAddModal || editPatientId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setEditPatientId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editPatientId ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            patientId={editPatientId || undefined}
            onSuccess={() => {
              setShowAddModal(false);
              setEditPatientId(null);
            }}
            onCancel={() => {
              setShowAddModal(false);
              setEditPatientId(null);
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
              Esta ação não pode ser desfeita. O paciente será removido permanentemente.
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

export default Patients;
