import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Mail, 
  Phone, 
  Building2, 
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
import DentistForm from "@/components/forms/dentist-form";
import { apiRequest } from "@/lib/queryClient";

const Dentists = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDentistId, setEditDentistId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch dentists
  const { data: dentists, isLoading } = useQuery({
    queryKey: ['/api/dentists'],
  });

  // Filter dentists based on search
  const filteredDentists = dentists?.filter(dentist => 
    dentist.name.toLowerCase().includes(search.toLowerCase()) ||
    (dentist.clinic && dentist.clinic.toLowerCase().includes(search.toLowerCase())) ||
    (dentist.email && dentist.email.toLowerCase().includes(search.toLowerCase())) ||
    (dentist.phone && dentist.phone.includes(search))
  );

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await apiRequest('DELETE', `/api/dentists/${deleteConfirmId}`);
      
      queryClient.invalidateQueries({
        queryKey: ['/api/dentists'],
      });
      
      toast({
        title: "Dentista/Clínica excluído",
        description: "O dentista ou clínica foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o dentista ou clínica.",
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
            placeholder="Buscar dentistas e clínicas..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Dentista/Clínica
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
                  <TableHead>Clínica</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDentists && filteredDentists.length > 0 ? (
                  filteredDentists.map((dentist) => (
                    <TableRow key={dentist.id}>
                      <TableCell className="font-medium">{dentist.name}</TableCell>
                      <TableCell>
                        {dentist.clinic && (
                          <div className="flex items-center text-sm">
                            <Building2 className="h-3 w-3 mr-1" />
                            {dentist.clinic}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {dentist.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {dentist.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {dentist.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {dentist.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {dentist.isActive ? (
                          <Badge className="bg-success bg-opacity-15 text-success">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-neutral-500">Inativo</Badge>
                        )}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => setEditDentistId(dentist.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-error"
                              onClick={() => setDeleteConfirmId(dentist.id)}
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
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {search ? "Nenhum dentista/clínica encontrado para esta busca." : "Nenhum dentista/clínica registrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Dentist Modal */}
      <Dialog 
        open={showAddModal || editDentistId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setEditDentistId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDentistId ? "Editar Dentista/Clínica" : "Novo Dentista/Clínica"}
            </DialogTitle>
          </DialogHeader>
          <DentistForm
            dentistId={editDentistId || undefined}
            onSuccess={() => {
              setShowAddModal(false);
              setEditDentistId(null);
            }}
            onCancel={() => {
              setShowAddModal(false);
              setEditDentistId(null);
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
              Esta ação não pode ser desfeita. O dentista/clínica será removido permanentemente.
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

export default Dentists;
