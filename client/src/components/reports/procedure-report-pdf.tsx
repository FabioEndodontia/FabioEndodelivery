import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Procedure, Patient, Dentist } from '@shared/schema';

// Cores FSF Endodontia de Alta Performance
const colors = {
  primary: '#1E8738', // Verde FSF
  secondary: '#8A2763', // Roxo/Bordô FSF
  lightSecondary: '#C499B3', // Versão mais clara do roxo
  black: '#333333',
  gray: '#666666',
  lightGray: '#EEEEEE',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    position: 'relative',
  },
  headerCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 100,
  },
  footerCorner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 100,
    height: 100,
    backgroundColor: colors.secondary,
    borderTopRightRadius: 100,
  },
  header: {
    marginBottom: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
  },
  section: {
    marginBottom: 25,
    zIndex: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: colors.black,
    marginBottom: 8,
  },
  divider: {
    borderBottom: `1px solid ${colors.lightSecondary}`,
    marginVertical: 15,
    position: 'relative',
    height: 2,
  },
  dividerDot: {
    position: 'absolute',
    backgroundColor: colors.secondary,
    width: 6,
    height: 6,
    borderRadius: 3,
    top: -2,
    left: '50%',
    marginLeft: -3,
  },
  footer: {
    paddingTop: 15,
    marginTop: 30,
    fontSize: 10,
    textAlign: 'center',
    color: colors.gray,
    position: 'relative',
    zIndex: 2,
  },
  // Novas propriedades para o grid de 3 imagens
  imageContainer: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageBox: {
    width: '32%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightSecondary,
    borderRadius: 5,
    padding: 5,
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: 120,
    objectFit: 'contain',
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 10,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyImagePlaceholder: {
    width: '100%',
    height: 120,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.lightSecondary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 3,
  },
  placeholderText: {
    fontSize: 10,
    color: colors.secondary,
  },
  logoBox: {
    width: '32%',
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    padding: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    fontStyle: 'italic',
  },
  logoSubtext: {
    fontSize: 8,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 5,
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
  
  // Verifica se a terceira imagem existe
  const hasThirdImage = !!procedure.thirdXrayUrl;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cantos decorativos, como no seu portfólio */}
        <View style={styles.headerCorner} />
        <View style={styles.footerCorner} />
        
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

        <View style={styles.divider}>
          <View style={styles.dividerDot} />
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagens Radiográficas</Text>
          
          <View style={styles.imageContainer}>
            {/* Slot 1 - Radiografia Inicial */}
            <View style={styles.imageBox}>
              {procedure.initialXrayUrl ? (
                <>
                  <Image 
                    src={procedure.initialXrayUrl} 
                    style={styles.image} 
                  />
                  <Text style={styles.imageLabel}>Radiografia Inicial</Text>
                </>
              ) : (
                <View style={styles.emptyImagePlaceholder}>
                  <Text style={styles.placeholderText}>Imagem 1</Text>
                </View>
              )}
            </View>
            
            {/* Slot 2 - Radiografia Final */}
            <View style={styles.imageBox}>
              {procedure.finalXrayUrl ? (
                <>
                  <Image 
                    src={procedure.finalXrayUrl} 
                    style={styles.image} 
                  />
                  <Text style={styles.imageLabel}>Radiografia Final</Text>
                </>
              ) : (
                <View style={styles.emptyImagePlaceholder}>
                  <Text style={styles.placeholderText}>Imagem 2</Text>
                </View>
              )}
            </View>
            
            {/* Slot 3 - Terceira imagem ou logo */}
            {hasThirdImage ? (
              <View style={styles.imageBox}>
                <Image 
                  src={procedure.thirdXrayUrl!} 
                  style={styles.image} 
                />
                <Text style={styles.imageLabel}>Imagem Adicional</Text>
              </View>
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>FSF</Text>
                <Text style={styles.logoSubtext}>ENDODONTIA DE ALTA PERFORMANCE</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Relatório gerado em {formatDate(date)}</Text>
          <Text style={{ color: colors.primary, fontWeight: 'bold', marginTop: 5 }}>
            Endodontia de Alta Performance
          </Text>
        </View>
      </Page>
    </Document>
  );
};