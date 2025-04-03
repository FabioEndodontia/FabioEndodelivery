import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, FileDown, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProcedureReport } from './reports/procedure-report-pdf';
import { Procedure, Dentist, Patient } from '@shared/schema';

interface ProcedureViewProps {
  procedure: Procedure;
  patient: Patient;
  dentist: Dentist;
  onClose?: () => void;
}

export default function ProcedureReportView({ procedure, patient, dentist, onClose }: ProcedureViewProps) {
  const [activeTab, setActiveTab] = useState("visualizar");
  const reportRef = useRef<HTMLDivElement>(null);

  // Função que formata os dados para o relatório
  const reportData = {
    procedure,
    patient,
    dentist,
    date: new Date().toISOString(),
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-muted/30">
        <div className="flex justify-between items-center">
          <CardTitle>Procedimento #{procedure.id}</CardTitle>
          <div className="flex gap-2">
            <PDFDownloadLink 
              document={<ProcedureReport data={reportData} />} 
              fileName={`relatorio-endo-${procedure.id}-${patient.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
              className="inline-flex"
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Baixar Relatório
                </Button>
              )}
            </PDFDownloadLink>
            
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="visualizar" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
            <TabsTrigger value="clinico">Relatório Clínico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualizar">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Paciente</h3>
                <p className="text-base font-medium">{patient.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dentista/Clínica</h3>
                <p className="text-base font-medium">{dentist.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dente</h3>
                <p className="text-base font-medium">{procedure.toothNumber}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Procedimento</h3>
                <p className="text-base font-medium">
                  {procedure.procedureType === 'TREATMENT' ? 'Tratamento' : 
                   procedure.procedureType === 'RETREATMENT' ? 'Retratamento' : 
                   procedure.procedureType === 'INSTRUMENT_REMOVAL' ? 'Remoção de Instrumento' : 
                   'Outro'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data do Atendimento</h3>
                <p className="text-base font-medium">{formatDate(procedure.procedureDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Valor</h3>
                <p className="text-base font-medium">{formatCurrency(procedure.value)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status do Pagamento</h3>
                <p className="text-base font-medium">
                  {procedure.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Forma de Pagamento</h3>
                <p className="text-base font-medium">
                  {procedure.paymentMethod === 'PIX' ? 'PIX' : 
                   procedure.paymentMethod === 'CASH' ? 'Dinheiro' : 
                   procedure.paymentMethod === 'BANK_TRANSFER' ? 'Transferência Bancária' : 
                   procedure.paymentMethod === 'CHECK' ? 'Cheque' : 
                   'Pendente'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="clinico">
            <div className="space-y-6 print-content" ref={reportRef}>
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">Relatório Endodôntico</h2>
                  <p className="text-sm text-muted-foreground">Dente {procedure.toothNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Data do Atendimento</p>
                  <p className="font-medium">{formatDate(procedure.procedureDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Paciente</h3>
                  <p>{patient.name}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Dentista Responsável</h3>
                  <p>{dentist.name}</p>
                  {dentist.clinic && <p className="text-sm text-muted-foreground">{dentist.clinic}</p>}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Diagnóstico</h3>
                  <p>{procedure.diagnosis || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Prognóstico</h3>
                  <p>{procedure.prognosis || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Medidas dos Canais</h3>
                  <p>{procedure.canalMeasurements || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p>{procedure.notes || "Sem observações adicionais"}</p>
                </div>
              </div>
              
              {(procedure.initialXrayUrl || procedure.finalXrayUrl) && (
                <div className="space-y-4 mt-6">
                  <h3 className="font-semibold">Radiografias</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {procedure.initialXrayUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Radiografia Inicial</p>
                        <img 
                          src={procedure.initialXrayUrl} 
                          alt="Radiografia Inicial" 
                          className="max-w-full h-auto rounded-md border"
                        />
                      </div>
                    )}
                    
                    {procedure.finalXrayUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Radiografia Final</p>
                        <img 
                          src={procedure.finalXrayUrl} 
                          alt="Radiografia Final" 
                          className="max-w-full h-auto rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-6 mt-8">
                <p className="text-center font-medium">Relatório gerado em {formatDate(new Date())}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}