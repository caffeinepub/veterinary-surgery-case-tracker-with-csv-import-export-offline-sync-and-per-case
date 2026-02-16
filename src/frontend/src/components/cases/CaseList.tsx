import { useCasesStore } from '../../hooks/useCasesStore';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import CaseCard from './CaseCard';
import EmptyCasesState from './EmptyCasesState';
import { Loader2 } from 'lucide-react';
import type { LocalSurgeryCase } from '../../types/cases';

interface CaseListProps {
  sortField: 'arrivalDate' | 'medicalRecordNumber';
  sortDirection: 'asc' | 'desc';
  onEditCase: (caseId: bigint) => void;
}

export default function CaseList({ sortField, sortDirection, onEditCase }: CaseListProps) {
  const { cases, isLoading } = useCasesStore();
  const { identity } = useInternetIdentity();
  const { isConnected } = useBackendConnection();
  const isOnline = useOnlineStatus();

  const isAuthenticated = !!identity;

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
    // Show migration guidance only when:
    // - User is authenticated
    // - Backend is connected
    // - Browser is online
    // - Case list is empty
    const showMigrationGuidance = isAuthenticated && isConnected && isOnline !== false;
    
    return <EmptyCasesState showMigrationGuidance={showMigrationGuidance} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedCases.map((surgeryCase) => (
        <CaseCard key={surgeryCase.caseId.toString()} case={surgeryCase} onEdit={onEditCase} />
      ))}
    </div>
  );
}
