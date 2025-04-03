import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTreatmentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Extend the schema with validation
const formSchema = insertTreatmentSchema.extend({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
});

interface NewTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewTreatmentDialog({ open, onOpenChange }: NewTreatmentDialogProps) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch patients and dentists
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });
  
  const { data: dentists = [] } = useQuery({
    queryKey: ["/api/dentists"],
  });
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: 0,
      dentistId: 0,
      toothNumber: "",
      treatmentType: "treatment",
      value: "0",
      paymentMethod: "pending",
      paymentStatus: "pending",
      paidBy: "dentist",
      hasInvoice: false,
      invoiceNumber: "",
      invoiceValue: "0",
      notes: "",
      patientName: "",
    },
  });
  
  // Handle invoice checkbox
  useEffect(() => {
    setShowInvoiceDetails(form.watch("hasInvoice"));
  }, [form.watch("hasInvoice")]);
  
  // Create mutation for adding a new treatment
  const createTreatment = useMutation({
    mutationFn: async (data: z.infer<typeof insertTreatmentSchema>) => {
      const res = await apiRequest("POST", "/api/treatments", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Atendimento registrado com sucesso.",
        variant: "default",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/financial"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao registrar atendimento: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Submit form data
    createTreatment.mutate({
      patientId: data.patientId,
      dentistId: data.dentistId,
      toothNumber: data.toothNumber,
      treatmentType: data.treatmentType as any,
      treatmentDate: new Date(),
      value: data.value,
      paymentMethod: data.paymentMethod as any,
      paymentStatus: data.paymentStatus as any,
      paidBy: data.paidBy,
      hasInvoice: data.hasInvoice,
      invoiceNumber: data.invoiceNumber,
      invoiceValue: data.invoiceValue,
      notes: data.notes,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Novo Atendimento</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dentistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dentista/Clínica</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a clínica" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dentists.map((dentist: any) => (
                          <SelectItem key={dentist.id} value={dentist.id.toString()}>
                            {dentist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="toothNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Dente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 36" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="treatmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Tratamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="treatment">Tratamento</SelectItem>
                        <SelectItem value="retreatment">Retratamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transfer_pix">Transferência/PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="late">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paidBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pago Por</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quem pagou" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dentist">Dentista/Clínica</SelectItem>
                        <SelectItem value="patient">Paciente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="hasInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Nota Fiscal Emitida</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {showInvoiceDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da NF</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="invoiceValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da NF (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTreatment.isPending}
              >
                {createTreatment.isPending ? "Salvando..." : "Salvar Atendimento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
