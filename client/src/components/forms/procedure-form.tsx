import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertProcedureSchema, InsertProcedure, PROCEDURE_TYPES, PAYMENT_METHODS, PAYMENT_STATUS } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getTranslatedProcedureType, 
  getTranslatedPaymentMethod, 
  getTranslatedPaymentStatus 
} from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, UploadCloud, X } from "lucide-react"; // Ícones

interface ProcedureFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  procedureId?: number;
}

const ProcedureForm: React.FC<ProcedureFormProps> = ({ onSuccess, onCancel, procedureId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shouldCreateInvoice, setShouldCreateInvoice] = useState(false);
  const isEditing = !!procedureId;
  
  // Estados para controlar o upload de imagens
  const [initialImageLoading, setInitialImageLoading] = useState(false);
  const [finalImageLoading, setFinalImageLoading] = useState(false);
  const [thirdImageLoading, setThirdImageLoading] = useState(false);
  
  // Referências para os inputs de arquivo
  const initialImageInputRef = useRef<HTMLInputElement>(null);
  const finalImageInputRef = useRef<HTMLInputElement>(null);
  const thirdImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch procedure data if editing
  const { data: procedureData, isLoading: isLoadingProcedure } = useQuery({
    queryKey: [procedureId ? `/api/procedures/${procedureId}` : null],
    enabled: isEditing,
  });

  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch dentists for dropdown
  const { data: dentists, isLoading: isLoadingDentists } = useQuery({
    queryKey: ['/api/dentists'],
  });

  const form = useForm<InsertProcedure>({
    resolver: zodResolver(insertProcedureSchema),
    defaultValues: {
      procedureDate: new Date(),
      paymentStatus: 'PENDING',
      paymentMethod: 'PENDING',
      diagnosis: '',
      prognosis: '',
      canalMeasurements: '',
      initialXrayUrl: '',
      finalXrayUrl: '',
      thirdXrayUrl: '',
      notes: '',
    },
  });

  // Initialize form with procedure data when available
  useEffect(() => {
    if (procedureData && isEditing) {
      // Use proper date objects for Zod validation
      const procedureDate = new Date(procedureData.procedureDate);
      const paymentDate = procedureData.paymentDate ? new Date(procedureData.paymentDate) : undefined;
      
      form.reset({
        ...procedureData,
        procedureDate,
        paymentDate,
      });
    }
  }, [procedureData, form, isEditing]);

  const onSubmit = async (data: InsertProcedure) => {
    try {
      if (isEditing) {
        await apiRequest('PUT', `/api/procedures/${procedureId}`, data);
        toast({
          title: "Procedimento atualizado",
          description: "O procedimento foi atualizado com sucesso.",
        });
      } else {
        const procedure = await apiRequest('POST', '/api/procedures', data);
        
        // Create invoice if checkbox is checked
        if (shouldCreateInvoice && data.paymentStatus === 'PAID') {
          const procedureJson = await procedure.json();
          await apiRequest('POST', '/api/invoices', {
            procedureId: procedureJson.id,
            invoiceValue: data.value,
            invoiceDate: new Date().toISOString(),
            isIssued: true,
          });
        }
        
        toast({
          title: "Procedimento registrado",
          description: "O procedimento foi registrado com sucesso.",
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['/api/procedures'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard/stats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard/recent-procedures'],
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o procedimento.",
        variant: "destructive",
      });
    }
  };

  // Função para fazer upload de imagem
  const uploadImage = async (file: File, setLoading: React.Dispatch<React.SetStateAction<boolean>>, fieldName: "initialXrayUrl" | "finalXrayUrl" | "thirdXrayUrl") => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar imagem');
      }
      
      const data = await response.json();
      
      // Atualiza o campo do formulário com a URL da imagem
      form.setValue(fieldName, data.url);
      
      toast({
        title: "Imagem enviada",
        description: "A imagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Manipuladores para os campos de upload de imagens
  const handleInitialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], setInitialImageLoading, "initialXrayUrl");
    }
  };
  
  const handleFinalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], setFinalImageLoading, "finalXrayUrl");
    }
  };
  
  const handleThirdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], setThirdImageLoading, "thirdXrayUrl");
    }
  };

  const isLoading = isLoadingProcedure || isLoadingPatients || isLoadingDentists || initialImageLoading || finalImageLoading || thirdImageLoading;

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient) => (
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
                      disabled={isLoading}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um dentista/clínica" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dentists?.map((dentist) => (
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

              <FormField
                control={form.control}
                name="toothNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Dente</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="11" 
                        max="48"
                        placeholder="11-48" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedureType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Procedimento</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o procedimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROCEDURE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTranslatedProcedureType(type)}
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
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico do Dente</FormLabel>
                    <FormControl>
                      <Input placeholder="Diagnóstico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="prognosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prognóstico</FormLabel>
                    <FormControl>
                      <Input placeholder="Prognóstico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="canalMeasurements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medidas do Canal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MV: 21.5mm, DV: 20mm, P: 22mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialXrayUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radiografia Inicial</FormLabel>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Radiografia Inicial" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={initialImageLoading}
                          onClick={() => initialImageInputRef.current?.click()}
                          className="flex items-center gap-1"
                        >
                          {initialImageLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          Upload
                        </Button>
                      </div>
                      {field.value && (
                        <div className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {field.value.split('/').pop()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => form.setValue("initialXrayUrl", "")}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={initialImageInputRef}
                        accept="image/*"
                        onChange={handleInitialImageUpload}
                        className="hidden"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="finalXrayUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radiografia Final</FormLabel>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Radiografia Final" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={finalImageLoading}
                          onClick={() => finalImageInputRef.current?.click()}
                          className="flex items-center gap-1"
                        >
                          {finalImageLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          Upload
                        </Button>
                      </div>
                      {field.value && (
                        <div className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {field.value.split('/').pop()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => form.setValue("finalXrayUrl", "")}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={finalImageInputRef}
                        accept="image/*"
                        onChange={handleFinalImageUpload}
                        className="hidden"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thirdXrayUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem Adicional</FormLabel>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Imagem Adicional" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={thirdImageLoading}
                          onClick={() => thirdImageInputRef.current?.click()}
                          className="flex items-center gap-1"
                        >
                          {thirdImageLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          Upload
                        </Button>
                      </div>
                      {field.value && (
                        <div className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {field.value.split('/').pop()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => form.setValue("thirdXrayUrl", "")}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={thirdImageInputRef}
                        accept="image/*"
                        onChange={handleThirdImageUpload}
                        className="hidden"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Cobrado (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedureDate"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Data do Atendimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...fieldProps}
                        value={value instanceof Date ? value.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {getTranslatedPaymentMethod(method)}
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
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getTranslatedPaymentStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Observações adicionais sobre o procedimento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && form.watch('paymentStatus') === 'PAID' && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="invoice" 
                  checked={shouldCreateInvoice}
                  onCheckedChange={(checked) => setShouldCreateInvoice(checked as boolean)}
                />
                <label
                  htmlFor="invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Emitir Nota Fiscal para este procedimento
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditing ? "Atualizar" : "Salvar"} Atendimento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProcedureForm;
