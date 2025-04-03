import { useState, useEffect } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Plus, Calculator } from "lucide-react";

// Tipos
type Material = {
  id: number;
  name: string;
  description: string | null;
  unitPrice: number;
  measurementUnit: string;
  stockQuantity: number;
  minimumStock: number | null;
  isActive: boolean;
  createdAt: string;
};

type ProcedureMaterial = {
  id: number;
  procedureType: string;
  materialId: number;
  quantity: number;
  createdAt: string;
  material: Material;
};

type FormData = {
  procedureType: string;
  materialId: number;
  quantity: number;
};

type CostInfo = {
  totalCost: number;
  materials: ProcedureMaterial[];
};

const PROCEDURE_TYPES = ["TREATMENT", "RETREATMENT", "INSTRUMENT_REMOVAL", "OTHER"];
const PROCEDURE_TYPE_LABELS = {
  TREATMENT: "Tratamento",
  RETREATMENT: "Retratamento",
  INSTRUMENT_REMOVAL: "Remoção de Instrumento",
  OTHER: "Outro"
};

export default function ProcedureMaterials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProcedureType, setSelectedProcedureType] = useState<string>("TREATMENT");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    procedureType: "TREATMENT",
    materialId: 0,
    quantity: 1,
  });
  const [showCost, setShowCost] = useState(false);

  // Atualizar procedureType no formData quando o tipo de procedimento selecionado mudar
  useEffect(() => {
    setFormData(prev => ({ ...prev, procedureType: selectedProcedureType }));
  }, [selectedProcedureType]);

  // Consultas
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["/api/materials"],
    select: (data: Material[]) => data.filter(m => m.isActive).sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: procedureMaterials, isLoading: isLoadingProcedureMaterials } = useQuery({
    queryKey: ["/api/procedure-materials", selectedProcedureType],
    queryFn: () => apiRequest(`/api/procedure-materials/${selectedProcedureType}`, "GET")
  });

  const { data: costInfo, isLoading: isLoadingCost } = useQuery({
    queryKey: ["/api/procedure-cost", selectedProcedureType],
    queryFn: () => apiRequest(`/api/procedure-cost/${selectedProcedureType}`, "GET"),
    enabled: showCost,
  });

  // Mutações
  const addMaterialMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/procedure-materials", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-materials", selectedProcedureType] });
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-cost", selectedProcedureType] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Material adicionado",
        description: "Material adicionado ao procedimento com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar material ao procedimento. " + error,
        variant: "destructive",
      });
    },
  });

  const removeMaterialMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/procedure-materials/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-materials", selectedProcedureType] });
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-cost", selectedProcedureType] });
      toast({
        title: "Material removido",
        description: "Material removido do procedimento com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao remover material do procedimento. " + error,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "quantity") {
      const numValue = Number(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 1 : numValue }));
    } else if (name === "materialId") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "materialId") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveMaterial = (id: number) => {
    if (confirm("Tem certeza que deseja remover este material do procedimento?")) {
      removeMaterialMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaterialMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      procedureType: selectedProcedureType,
      materialId: 0,
      quantity: 1,
    });
  };

  // Formatar valores em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="container mx-auto p-4">
      <PageTitle
        title="Materiais por Procedimento"
        description="Gerencie os materiais utilizados em cada tipo de procedimento e calcule custos"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Tipo de Procedimento</CardTitle>
            <CardDescription>
              Selecione o tipo de procedimento para gerenciar os materiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Tabs 
                defaultValue="TREATMENT" 
                value={selectedProcedureType} 
                onValueChange={setSelectedProcedureType}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-4">
                  {PROCEDURE_TYPES.map(type => (
                    <TabsTrigger key={type} value={type}>
                      {PROCEDURE_TYPE_LABELS[type as keyof typeof PROCEDURE_TYPE_LABELS]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Button 
          variant={showCost ? "secondary" : "outline"} 
          onClick={() => setShowCost(!showCost)}
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          {showCost ? "Ocultar Custo" : "Mostrar Custo"}
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Material ao Procedimento</DialogTitle>
              <DialogDescription>
                Adicione um material ao tipo de procedimento: {" "}
                {PROCEDURE_TYPE_LABELS[selectedProcedureType as keyof typeof PROCEDURE_TYPE_LABELS]}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="materialId">Material</Label>
                  <Select
                    value={formData.materialId.toString()}
                    onValueChange={(value) => handleSelectChange("materialId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} - {formatCurrency(material.unitPrice)} / {material.measurementUnit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMaterialMutation.isPending || formData.materialId === 0}
                >
                  {addMaterialMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Adicionar Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Materiais para {PROCEDURE_TYPE_LABELS[selectedProcedureType as keyof typeof PROCEDURE_TYPE_LABELS]}
          </CardTitle>
          <CardDescription>
            Lista de materiais utilizados neste tipo de procedimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProcedureMaterials ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : procedureMaterials && procedureMaterials.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    {showCost && <TableHead>Subtotal</TableHead>}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedureMaterials.map((pm: ProcedureMaterial) => (
                    <TableRow key={pm.id}>
                      <TableCell className="font-medium">{pm.material.name}</TableCell>
                      <TableCell>{pm.material.measurementUnit}</TableCell>
                      <TableCell>{pm.quantity}</TableCell>
                      <TableCell>{formatCurrency(pm.material.unitPrice)}</TableCell>
                      {showCost && (
                        <TableCell>{formatCurrency(pm.quantity * pm.material.unitPrice)}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMaterial(pm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Linha de total quando showCost estiver ativo */}
                  {showCost && costInfo && (
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell colSpan={3}>Custo Total do Procedimento</TableCell>
                      <TableCell colSpan={showCost ? 2 : 1}>
                        {formatCurrency(costInfo.totalCost)}
                      </TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Nenhum material cadastrado para este tipo de procedimento. 
              Clique em "Adicionar Material" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}