import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDentistSchema } from "@shared/schema";

const formSchema = insertDentistSchema.extend({
  name: z.string().min(1, "Nome é obrigatório"),
});

export default function Dentists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<any>(null);
  
  const { data: dentists, isLoading } = useQuery({
    queryKey: ["/api/dentists"],
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clinicName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });
  
  const createDentist = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/dentists", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Dentista/Clínica adicionado com sucesso.",
        variant: "default",
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dentists"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar dentista/clínica: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const updateDentist = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/dentists/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Dentista/Clínica atualizado com sucesso.",
        variant: "default",
      });
      setDialogOpen(false);
      setSelectedDentist(null);
      queryClient.invalidateQueries({ queryKey: ["/api/dentists"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar dentista/clínica: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleAddDentist = () => {
    form.reset({
      name: "",
      clinicName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setSelectedDentist(null);
    setDialogOpen(true);
  };
  
  const handleEditDentist = (dentist: any) => {
    form.reset({
      name: dentist.name,
      clinicName: dentist.clinicName || "",
      phone: dentist.phone || "",
      email: dentist.email || "",
      address: dentist.address || "",
      notes: dentist.notes || "",
    });
    setSelectedDentist(dentist);
    setDialogOpen(true);
  };
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedDentist) {
      updateDentist.mutate({ id: selectedDentist.id, data });
    } else {
      createDentist.mutate(data);
    }
  };
  
  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "clinicName",
      header: "Nome da Clínica",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: (dentist: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleEditDentist(dentist);
          }}
        >
          <i className="ri-edit-line mr-1"></i> Editar
        </Button>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dentistas/Clínicas</h1>
        <Button onClick={handleAddDentist}>
          <i className="ri-user-add-line mr-2"></i> Adicionar Dentista/Clínica
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : (
          <DataTable 
            data={dentists || []}
            columns={columns}
            searchable
            searchKey="name"
            onRowClick={handleEditDentist}
          />
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDentist ? "Editar Dentista/Clínica" : "Adicionar Dentista/Clínica"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do dentista ou responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da clínica (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="exemplo@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o dentista/clínica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createDentist.isPending || updateDentist.isPending}
                >
                  {createDentist.isPending || updateDentist.isPending
                    ? "Salvando..."
                    : selectedDentist
                    ? "Atualizar"
                    : "Adicionar"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
