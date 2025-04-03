import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatShortDate, getTranslatedProcedureType } from "@/lib/utils";

interface Procedure {
  id: number;
  patientName: string;
  dentistName: string;
  toothNumber: number;
  procedureType: string;
  value: number;
  procedureDate: string;
}

interface ProcedureListProps {
  procedures: Procedure[];
  isLoading: boolean;
}

const ProcedureList: React.FC<ProcedureListProps> = ({ procedures, isLoading }) => {
  if (isLoading) {
    return <ProcedureListSkeleton />;
  }

  return (
    <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Paciente</TableHead>
            <TableHead className="w-[150px]">Dentista/Clínica</TableHead>
            <TableHead className="w-[80px]">Dente</TableHead>
            <TableHead className="w-[150px]">Procedimento</TableHead>
            <TableHead className="w-[100px]">Valor</TableHead>
            <TableHead className="w-[100px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {procedures.length > 0 ? (
            procedures.map((procedure) => (
              <TableRow key={procedure.id} className="hover:bg-neutral-50">
                <TableCell className="font-medium">{procedure.patientName}</TableCell>
                <TableCell>{procedure.dentistName}</TableCell>
                <TableCell>{procedure.toothNumber}</TableCell>
                <TableCell>{getTranslatedProcedureType(procedure.procedureType)}</TableCell>
                <TableCell>{formatCurrency(procedure.value)}</TableCell>
                <TableCell>{formatShortDate(procedure.procedureDate)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                Nenhum procedimento encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const ProcedureListSkeleton = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-12 w-[150px]" />
          <Skeleton className="h-12 w-[150px]" />
          <Skeleton className="h-12 w-[80px]" />
          <Skeleton className="h-12 w-[150px]" />
          <Skeleton className="h-12 w-[100px]" />
          <Skeleton className="h-12 w-[100px]" />
        </div>
      ))}
    </div>
  );
};

export default ProcedureList;
