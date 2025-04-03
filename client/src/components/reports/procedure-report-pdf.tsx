import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Procedure, Patient, Dentist } from '@shared/schema';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottom: '1px solid #ccc',
    paddingBottom: 10,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    marginBottom: 8,
  },
  divider: {
    borderBottom: '1px solid #eee',
    marginVertical: 15,
  },
  footer: {
    borderTop: '1px solid #ccc',
    paddingTop: 10,
    marginTop: 20,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  imageContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    width: '48%',
  },
  image: {
    width: '100%',
    objectFit: 'contain',
    marginBottom: 5,
  },
  imageLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

interface ReportData {
  procedure: Procedure;
  patient: Patient;
  dentist: Dentist;
  date: string;
}

interface ProcedureReportProps {
  data: ReportData;
}

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getProcedureTypeText = (type: string): string => {
  switch (type) {
    case 'TREATMENT':
      return 'Tratamento';
    case 'RETREATMENT':
      return 'Retratamento';
    case 'INSTRUMENT_REMOVAL':
      return 'Remoção de Instrumento';
    default:
      return 'Outro';
  }
};

export const ProcedureReport = ({ data }: ProcedureReportProps) => {
  const { procedure, patient, dentist, date } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Relatório Endodôntico</Text>
            <Text style={styles.subtitle}>Dente {procedure.toothNumber}</Text>
          </View>
          <View>
            <Text style={styles.date}>Data do Atendimento:</Text>
            <Text style={styles.date}>{formatDate(procedure.procedureDate)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Dados do Paciente</Text>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{patient.name}</Text>
            
            {patient.phone && (
              <>
                <Text style={styles.label}>Telefone:</Text>
                <Text style={styles.value}>{patient.phone}</Text>
              </>
            )}
          </View>
          
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Dados do Profissional</Text>
            <Text style={styles.label}>Dentista:</Text>
            <Text style={styles.value}>{dentist.name}</Text>
            
            {dentist.clinic && (
              <>
                <Text style={styles.label}>Clínica:</Text>
                <Text style={styles.value}>{dentist.clinic}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Procedimento</Text>
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Dente:</Text>
              <Text style={styles.value}>{procedure.toothNumber}</Text>
            </View>
            
            <View style={styles.column}>
              <Text style={styles.label}>Tipo de Procedimento:</Text>
              <Text style={styles.value}>{getProcedureTypeText(procedure.procedureType)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatório Clínico</Text>
          
          <Text style={styles.label}>Diagnóstico:</Text>
          <Text style={styles.value}>{procedure.diagnosis || "Não informado"}</Text>
          
          <Text style={styles.label}>Prognóstico:</Text>
          <Text style={styles.value}>{procedure.prognosis || "Não informado"}</Text>
          
          <Text style={styles.label}>Medidas dos Canais:</Text>
          <Text style={styles.value}>{procedure.canalMeasurements || "Não informado"}</Text>
          
          <Text style={styles.label}>Observações:</Text>
          <Text style={styles.value}>{procedure.notes || "Sem observações adicionais"}</Text>
        </View>

        {(procedure.initialXrayUrl || procedure.finalXrayUrl) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Radiografias</Text>
            
            <View style={styles.imageContainer}>
              {procedure.initialXrayUrl && (
                <View style={styles.imageWrapper}>
                  <Image 
                    src={procedure.initialXrayUrl} 
                    style={styles.image} 
                  />
                  <Text style={styles.imageLabel}>Radiografia Inicial</Text>
                </View>
              )}
              
              {procedure.finalXrayUrl && (
                <View style={styles.imageWrapper}>
                  <Image 
                    src={procedure.finalXrayUrl} 
                    style={styles.image} 
                  />
                  <Text style={styles.imageLabel}>Radiografia Final</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Relatório gerado em {formatDate(date)}</Text>
        </View>
      </Page>
    </Document>
  );
};