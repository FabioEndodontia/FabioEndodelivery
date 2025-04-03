import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const handleSave = () => {
    setLoading(true);
    
    // Simulate saving settings
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
        variant: "default",
      });
    }, 1000);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="invoice">Nota Fiscal</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue="Dr. Rodrigo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input id="specialty" defaultValue="Endodontista" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="dr.rodrigo@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 98765-4321" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professional-id">Registro Profissional (CRO)</Label>
                <Input id="professional-id" defaultValue="CRO-SP 12345" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Atualize sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input id="current-password" type="password" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="two-factor" />
                <Label htmlFor="two-factor">Ativar autenticação de dois fatores</Label>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="invoice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Nota Fiscal</CardTitle>
              <CardDescription>
                Configure suas preferências para emissão de notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-company">Razão Social / Nome</Label>
                <Input id="invoice-company" defaultValue="Dr. Rodrigo Silva Endodontia" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf-cnpj">CPF/CNPJ</Label>
                  <Input id="cpf-cnpj" defaultValue="123.456.789-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Inscrição Municipal</Label>
                  <Input id="tax-id" defaultValue="123456" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Av. Paulista, 1000, São Paulo - SP" />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="default-service">Descrição Padrão do Serviço</Label>
                <Input 
                  id="default-service" 
                  defaultValue="Serviços de endodontia conforme especificado." 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-code">Código de Serviço</Label>
                  <Input id="service-code" defaultValue="8630-5/04" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-percentage">Porcentagem de Impostos</Label>
                  <div className="flex items-center">
                    <Input id="tax-percentage" defaultValue="11" />
                    <span className="ml-2">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="auto-invoice" defaultChecked />
                <Label htmlFor="auto-invoice">Sugerir emissão de nota fiscal para novos atendimentos</Label>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notificações por Email</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-payments">Pagamentos recebidos</Label>
                    <p className="text-sm text-neutral-500">
                      Notificar quando um pagamento for confirmado
                    </p>
                  </div>
                  <Switch id="email-payments" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-reports">Relatórios semanais</Label>
                    <p className="text-sm text-neutral-500">
                      Receber um resumo semanal das atividades
                    </p>
                  </div>
                  <Switch id="email-reports" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-pending">Pagamentos pendentes</Label>
                    <p className="text-sm text-neutral-500">
                      Lembrete sobre pagamentos pendentes
                    </p>
                  </div>
                  <Switch id="email-pending" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Lembretes</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-upcoming">Próximos atendimentos</Label>
                    <p className="text-sm text-neutral-500">
                      Lembrete sobre atendimentos agendados
                    </p>
                  </div>
                  <Switch id="reminder-upcoming" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-invoice">Notas fiscais pendentes</Label>
                    <p className="text-sm text-neutral-500">
                      Lembrete para emitir notas fiscais pendentes
                    </p>
                  </div>
                  <Switch id="reminder-invoice" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalização da Interface</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema conforme sua preferência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 flex flex-col items-center space-y-2 cursor-pointer bg-white border-primary-600">
                      <div className="w-8 h-8 bg-white border rounded-full"></div>
                      <span className="text-sm font-medium">Claro</span>
                    </div>
                    <div className="border rounded-lg p-4 flex flex-col items-center space-y-2 cursor-pointer">
                      <div className="w-8 h-8 bg-neutral-800 rounded-full"></div>
                      <span className="text-sm">Escuro</span>
                    </div>
                    <div className="border rounded-lg p-4 flex flex-col items-center space-y-2 cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-r from-white to-neutral-800 rounded-full"></div>
                      <span className="text-sm">Sistema</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Data</Label>
                  <Select defaultValue="dd/MM/yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency-format">Formato de Moeda</Label>
                  <Select defaultValue="BRL">
                    <SelectTrigger id="currency-format">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">R$ (Real Brasileiro)</SelectItem>
                      <SelectItem value="USD">$ (Dólar Americano)</SelectItem>
                      <SelectItem value="EUR">€ (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
