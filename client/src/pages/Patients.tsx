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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { insertPatientSchema } from "@shared/schema";

const formSchema = insertPatientSchema.extend({
  name: z.string().min(1, "Nome é obrigatório"),
});

export default function Patients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
  });
  
  const { data: dentists = [], isLoading: isLoadingDentists } = useQuery({
    queryKey: ["/api/dentists"],
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema.extend({
      dentistId: z.number({
        required_error: "Selecione um dentista responsável",
        invalid_type_error: "Selecione um dentista válido",
      }).min(1, "Selecione um dentista responsável"),
    })),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
      dentistId: undefined,
    },
  });
  
  const createPatient = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Paciente adicionado com sucesso.",
        variant: "default",
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar paciente: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const updatePatient = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/patients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Paciente atualizado com sucesso.",
        variant: "default",
      });
      setDialogOpen(false);
      setSelectedPatient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar paciente: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleAddPatient = () => {
    form.reset({
      name: "",
      phone: "",
      email: "",
      notes: "",
      dentistId: undefined,
    });
    setSelectedPatient(null);
    setDialogOpen(true);
  };
  
  const handleEditPatient = (patient: any) => {
    form.reset({
      name: patient.name,
      phone: patient.phone || "",
      email: patient.email || "",
      notes: patient.notes || "",
      dentistId: patient.dentistId,
    });
    setSelectedPatient(patient);
    setDialogOpen(true);
  };
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedPatient) {
      updatePatient.mutate({ id: selectedPatient.id, data });
    } else {
      createPatient.mutate(data);
    }
  };
  
  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
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
      id: "dentist",
      header: "Dentista Responsável",
      cell: ({ row }: any) => {
        const patient = row.original;
        const dentist = dentists.find((d: any) => d.id === patient.dentistId);
        return dentist ? dentist.name : "Não atribuído";
      }
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleEditPatient(row.original);
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
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={handleAddPatient}>
          <i className="ri-user-add-line mr-2"></i> Adicionar Paciente
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoadingPatients || isLoadingDentists ? (
          <div className="text-center py-4">Carregando...</div>
        ) : (
          <DataTable 
            data={patients}
            columns={columns}
            searchable
            searchKey="name"
            onRowClick={handleEditPatient}
          />
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? "Editar Paciente" : "Adicionar Paciente"}
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
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dentistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dentista Responsável</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
                      required
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dentista responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dentists && dentists.length > 0 ? (
                          dentists.map((dentist: any) => (
                            <SelectItem key={dentist.id} value={String(dentist.id)}>
                              {dentist.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="0" disabled>
                            Nenhum dentista cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                  disabled={createPatient.isPending || updatePatient.isPending}
                >
                  {createPatient.isPending || updatePatient.isPending
                    ? "Salvando..."
                    : selectedPatient
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
