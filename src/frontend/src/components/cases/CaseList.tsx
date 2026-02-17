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
  searchQuery: string;
  onEditCase: (caseId: bigint) => void;
}

export default function CaseList({ sortField, sortDirection, searchQuery, onEditCase }: CaseListProps) {
  const { cases, isLoading } = useCasesStore();
  const { identity } = useInternetIdentity();
  const { isConnected } = useBackendConnection();
  const isOnline = useOnlineStatus();

  const isAuthenticated = !!identity;

  // Filter cases by search query
  const filteredCases = (cases || []).filter((surgeryCase) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const demographics = surgeryCase.patientDemographics;
    const presentingComplaint = surgeryCase.presentingComplaint || '';

    // Search across multiple fields including presenting complaint
    return (
      demographics.name.toLowerCase().includes(query) ||
      surgeryCase.medicalRecordNumber.toLowerCase().includes(query) ||
      demographics.ownerLastName.toLowerCase().includes(query) ||
      demographics.species.toLowerCase().includes(query) ||
      demographics.breed.toLowerCase().includes(query) ||
      demographics.sex.toLowerCase().includes(query) ||
      demographics.dateOfBirth.toLowerCase().includes(query) ||
      presentingComplaint.toLowerCase().includes(query)
    );
  });

  // Sort the filtered cases
  const sortedCases = [...filteredCases].sort((a, b) => {
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

  if (!cases || cases.length === 0) {
    // Show migration guidance only when:
    // - User is authenticated
    // - Backend is connected
    // - Browser is online
    // - Case list is empty
    const showMigrationGuidance = isAuthenticated && isConnected && isOnline !== false;
    
    return (
      <EmptyCasesState 
        showMigrationGuidance={showMigrationGuidance}
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (sortedCases.length === 0 && searchQuery.trim()) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cases found matching "{searchQuery}"</p>
        <p className="text-sm text-muted-foreground mt-2">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedCases.map((surgeryCase) => (
        <CaseCard key={surgeryCase.caseId.toString()} surgeryCase={surgeryCase} onEdit={onEditCase} />
      ))}
    </div>
  );
}
