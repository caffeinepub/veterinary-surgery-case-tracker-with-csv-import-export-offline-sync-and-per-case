import { useCasesStore } from '../../hooks/useCasesStore';
import CaseCard from './CaseCard';
import { Loader2, FolderOpen } from 'lucide-react';
import type { LocalSurgeryCase } from '../../types/cases';

interface CaseListProps {
  sortField: 'arrivalDate' | 'medicalRecordNumber';
  sortDirection: 'asc' | 'desc';
  onEditCase: (caseId: bigint) => void;
}

export default function CaseList({ sortField, sortDirection, onEditCase }: CaseListProps) {
  const { cases, isLoading } = useCasesStore();

  const sortedCases = [...cases].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'arrivalDate') {
      comparison = Number(a.arrivalDate - b.arrivalDate);
    } else {
      comparison = a.medicalRecordNumber.localeCompare(b.medicalRecordNumber);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-6">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
        <p className="text-muted-foreground">Create your first case using the form above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedCases.map((surgeryCase) => (
        <CaseCard key={surgeryCase.caseId.toString()} case={surgeryCase} onEdit={onEditCase} />
      ))}
    </div>
  );
}
