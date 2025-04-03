import { useState } from "react";
import { PageTitle } from "@/components/ui/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, PenSquare, Trash2, ShoppingCart, AlertTriangle } from "lucide-react";

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

type FormData = {
  name: string;
  description: string | null;
  unitPrice: number;
  measurementUnit: string;
  stockQuantity: number;
  minimumStock: number | null;
};

const MEASUREMENT_UNITS = ["UNIDADE", "CAIXA", "PACOTE", "ML", "GRAMA"];

export default function Materials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: null,
    unitPrice: 0,
    measurementUnit: "UNIDADE",
    stockQuantity: 0,
    minimumStock: 0,
  });
  const [stockQuantity, setStockQuantity] = useState(0);

  // Consultas
  const { data: materials, isLoading } = useQuery({
    queryKey: ["/api/materials"],
    select: (data: Material[]) => data.sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: lowStockMaterials, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ["/api/materials/low-stock"],
    select: (data: Material[]) => data.sort((a, b) => a.name.localeCompare(b.name))
  });

  // Mutações
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/materials", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/low-stock"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Material adicionado",
        description: "Material cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar material. " + error,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; formData: Partial<FormData> }) => 
      apiRequest(`/api/materials/${data.id}`, "PATCH", data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/low-stock"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Material atualizado",
        description: "Material atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar material. " + error,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/materials/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/low-stock"] });
      toast({
        title: "Material removido",
        description: "Material removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao remover material. O material pode estar em uso em algum procedimento.",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: (data: { id: number; quantity: number }) => 
      apiRequest(`/api/materials/${data.id}/stock`, "PATCH", { quantity: data.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/low-stock"] });
      setIsStockDialogOpen(false);
      toast({
        title: "Estoque atualizado",
        description: "Estoque atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar estoque. " + error,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "unitPrice" || name === "stockQuantity" || name === "minimumStock") {
      const numValue = Number(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (material: Material) => {
    setCurrentMaterial(material);
    setFormData({
      name: material.name,
      description: material.description,
      unitPrice: material.unitPrice,
      measurementUnit: material.measurementUnit,
      stockQuantity: material.stockQuantity,
      minimumStock: material.minimumStock,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial) return;
    updateMutation.mutate({ id: currentMaterial.id, formData });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este material?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateStock = (material: Material) => {
    setCurrentMaterial(material);
    setStockQuantity(material.stockQuantity);
    setIsStockDialogOpen(true);
  };

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial) return;
    updateStockMutation.mutate({ id: currentMaterial.id, quantity: stockQuantity });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: null,
      unitPrice: 0,
      measurementUnit: "UNIDADE",
      stockQuantity: 0,
      minimumStock: 0,
    });
    setCurrentMaterial(null);
  };

  // Formatar valores em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="container mx-auto p-4">
      <PageTitle
        title="Gerenciamento de Materiais"
        description="Controle o estoque e custos dos materiais utilizados nos procedimentos"
      />

      <div className="flex justify-end mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Material</DialogTitle>
              <DialogDescription>
                Preencha as informações do material a ser cadastrado
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Preço Unitário</Label>
                    <Input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="measurementUnit">Unidade de Medida</Label>
                    <Select
                      value={formData.measurementUnit}
                      onValueChange={(value) => handleSelectChange("measurementUnit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEASUREMENT_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Quantidade em Estoque</Label>
                    <Input
                      id="stockQuantity"
                      name="stockQuantity"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                    <Input
                      id="minimumStock"
                      name="minimumStock"
                      type="number"
                      min="0"
                      value={formData.minimumStock || 0}
                      onChange={handleInputChange}
                    />
                  </div>
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Salvar Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos os Materiais</TabsTrigger>
          <TabsTrigger value="lowStock">
            Estoque Baixo
            {lowStockMaterials && lowStockMaterials.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockMaterials.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Materiais Cadastrados</CardTitle>
              <CardDescription>
                Lista de todos os materiais utilizados nos procedimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : materials && materials.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Preço Unitário</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                          <TableCell>{material.measurementUnit}</TableCell>
                          <TableCell>
                            {material.stockQuantity <= (material.minimumStock || 0) ? (
                              <div className="flex items-center">
                                <span className="mr-2">{material.stockQuantity}</span>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </div>
                            ) : (
                              material.stockQuantity
                            )}
                          </TableCell>
                          <TableCell>{material.minimumStock || "-"}</TableCell>
                          <TableCell>
                            {material.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateStock(material)}
                                title="Atualizar estoque"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(material)}
                                title="Editar material"
                              >
                                <PenSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(material.id)}
                                title="Remover material"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum material cadastrado. Clique em "Adicionar Material" para começar.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowStock">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Materiais com Estoque Baixo</CardTitle>
              <CardDescription>
                Materiais que estão com quantidade em estoque abaixo do mínimo estabelecido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLowStock ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : lowStockMaterials && lowStockMaterials.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell className="text-amber-600 font-semibold">{material.stockQuantity}</TableCell>
                          <TableCell>{material.minimumStock}</TableCell>
                          <TableCell>{material.measurementUnit}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStock(material)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Atualizar Estoque
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Não existem materiais com estoque baixo no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Material</DialogTitle>
            <DialogDescription>
              Atualize as informações do material
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateMaterial} className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-unitPrice">Preço Unitário</Label>
                  <Input
                    id="edit-unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-measurementUnit">Unidade de Medida</Label>
                  <Select
                    value={formData.measurementUnit}
                    onValueChange={(value) => handleSelectChange("measurementUnit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-minimumStock">Estoque Mínimo</Label>
                  <Input
                    id="edit-minimumStock"
                    name="minimumStock"
                    type="number"
                    min="0"
                    value={formData.minimumStock || 0}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualização de Estoque */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              {currentMaterial && `Atualize a quantidade em estoque de ${currentMaterial.name}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-quantity">Nova Quantidade em Estoque</Label>
              <Input
                id="stock-quantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                required
              />
              {currentMaterial && currentMaterial.minimumStock !== null && stockQuantity < currentMaterial.minimumStock && (
                <p className="text-sm text-amber-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Este valor está abaixo do estoque mínimo ({currentMaterial.minimumStock})
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStockDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateStockMutation.isPending}>
                {updateStockMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Atualizar Estoque
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}