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
    <Card className="w-full max-w-4xl mx-auto fsf-card">
      <CardHeader className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-fsf-primary rounded-bl-full"></div>
        <div className="z-10 flex justify-between items-center">
          <CardTitle className="text-fsf-primary font-bold">Procedimento #{procedure.id}</CardTitle>
          <div className="flex gap-2 z-10">
            <PDFDownloadLink 
              document={<ProcedureReport data={reportData} />} 
              fileName={`relatorio-endo-${procedure.id}-${patient.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
              className="inline-flex"
            >
              {({ loading }) => (
                <Button variant="outline" className="border-fsf-secondary text-fsf-secondary hover:bg-fsf-secondary hover:text-white" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Baixar Relatório
                </Button>
              )}
            </PDFDownloadLink>
            
            <Button variant="outline" onClick={() => window.print()} className="border-fsf-secondary text-fsf-secondary hover:bg-fsf-secondary hover:text-white">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="text-fsf-secondary hover:text-fsf-secondary/80">
                Fechar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="visualizar" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-fsf-secondary/30">
            <TabsTrigger value="visualizar" className="data-[state=active]:bg-fsf-primary data-[state=active]:text-white">Visualizar</TabsTrigger>
            <TabsTrigger value="clinico" className="data-[state=active]:bg-fsf-primary data-[state=active]:text-white">Relatório Clínico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualizar">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Paciente</h3>
                <p className="text-base font-medium">{patient.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Dentista/Clínica</h3>
                <p className="text-base font-medium">{dentist.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Dente</h3>
                <p className="text-base font-medium">{procedure.toothNumber}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Procedimento</h3>
                <p className="text-base font-medium">
                  {procedure.procedureType === 'TREATMENT' ? 'Tratamento' : 
                   procedure.procedureType === 'RETREATMENT' ? 'Retratamento' : 
                   procedure.procedureType === 'INSTRUMENT_REMOVAL' ? 'Remoção de Instrumento' : 
                   'Outro'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Data do Atendimento</h3>
                <p className="text-base font-medium">{formatDate(procedure.procedureDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Valor</h3>
                <p className="text-base font-medium text-fsf-primary font-bold">{formatCurrency(procedure.value)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Status do Pagamento</h3>
                <p className={`text-base font-medium ${procedure.paymentStatus === 'PAID' ? 'text-fsf-primary' : 'text-fsf-secondary'}`}>
                  {procedure.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-fsf-secondary">Forma de Pagamento</h3>
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
              <div className="flex justify-between border-b border-fsf-secondary pb-4 relative">
                <div className="fsf-divider-dot-container absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="fsf-divider-dot"></div>
                </div>
                <div>
                  <h2 className="fsf-report-title">Relatório Endodôntico</h2>
                  <p className="text-sm text-fsf-secondary">Dente {procedure.toothNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-fsf-secondary">Data do Atendimento</p>
                  <p className="font-medium">{formatDate(procedure.procedureDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Paciente</h3>
                  <p>{patient.name}</p>
                </div>
                
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Dentista Responsável</h3>
                  <p>{dentist.name}</p>
                  {dentist.clinic && <p className="text-sm text-fsf-secondary">{dentist.clinic}</p>}
                </div>
              </div>
              
              <div className="fsf-divider">
                <div className="fsf-divider-dot-container">
                  <div className="fsf-divider-dot"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Diagnóstico</h3>
                  <p>{procedure.diagnosis || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Prognóstico</h3>
                  <p>{procedure.prognosis || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Medidas dos Canais</h3>
                  <p>{procedure.canalMeasurements || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="text-fsf-primary font-bold mb-2">Observações</h3>
                  <p>{procedure.notes || "Sem observações adicionais"}</p>
                </div>
              </div>
              
              {(procedure.initialXrayUrl || procedure.finalXrayUrl) && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-fsf-primary font-bold italic mb-2">Radiografias</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {procedure.initialXrayUrl && (
                      <div className="border border-fsf-secondary rounded-md p-2">
                        <p className="text-sm text-fsf-secondary font-bold mb-2 text-center">Radiografia Inicial</p>
                        <img 
                          src={procedure.initialXrayUrl} 
                          alt="Radiografia Inicial" 
                          className="max-w-full h-auto rounded-md"
                        />
                      </div>
                    )}
                    
                    {procedure.finalXrayUrl && (
                      <div className="border border-fsf-secondary rounded-md p-2">
                        <p className="text-sm text-fsf-secondary font-bold mb-2 text-center">Radiografia Final</p>
                        <img 
                          src={procedure.finalXrayUrl} 
                          alt="Radiografia Final" 
                          className="max-w-full h-auto rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="fsf-divider">
                <div className="fsf-divider-dot-container">
                  <div className="fsf-divider-dot"></div>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-center font-medium">Relatório gerado em {formatDate(new Date())}</p>
                <p className="text-center text-fsf-primary font-bold italic mt-1">Endodontia de Alta Performance</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}