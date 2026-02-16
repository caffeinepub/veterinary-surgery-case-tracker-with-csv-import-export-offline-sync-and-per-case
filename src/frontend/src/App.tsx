import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useBackendConnection } from './hooks/useBackendConnection';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CaseList from './components/cases/CaseList';
import CaseForm from './components/cases/CaseForm';
import SyncStatusBar from './components/sync/SyncStatusBar';
import CsvImportDialog from './components/csv/CsvImportDialog';
import CsvExportButton from './components/csv/CsvExportButton';
import SortControls from './components/cases/SortControls';
import StartupRecoveryScreen from './components/startup/StartupRecoveryScreen';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { isConnected, isInitializing: backendInitializing, error: backendError, retry: retryBackend } = useBackendConnection();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [sortField, setSortField] = useState<'arrivalDate' | 'medicalRecordNumber'>('arrivalDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingCaseId, setEditingCaseId] = useState<bigint | null>(null);
  const [showCaseFormModal, setShowCaseFormModal] = useState(false);
  const [startupTimeout, setStartupTimeout] = useState(false);

  // Show profile setup only when authenticated, connected, and no profile exists
  useEffect(() => {
    if (isAuthenticated && isConnected && !profileLoading && isFetched && userProfile === null) {
      setShowProfileSetup(true);
    }
  }, [isAuthenticated, isConnected, profileLoading, isFetched, userProfile]);

  // Detect startup timeout for authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setStartupTimeout(false);
      return;
    }

    if (backendInitializing) {
      const timer = setTimeout(() => {
        setStartupTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else {
      setStartupTimeout(false);
    }
  }, [backendInitializing, isAuthenticated]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    await saveProfile.mutateAsync({ name: profileName.trim() });
    setShowProfileSetup(false);
  };

  const handleRetry = async () => {
    setStartupTimeout(false);
    await retryBackend();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleAddCase = () => {
    setEditingCaseId(null);
    setShowCaseFormModal(true);
  };

  const handleEditCase = (caseId: bigint) => {
    setEditingCaseId(caseId);
    setShowCaseFormModal(true);
  };

  const handleCloseCaseForm = () => {
    setShowCaseFormModal(false);
    setEditingCaseId(null);
  };

  const handleSaveComplete = () => {
    setShowCaseFormModal(false);
    setEditingCaseId(null);
  };

  // Only block on Internet Identity initialization, not backend
  if (loginStatus === 'initializing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show unauthenticated UI immediately without blocking on backend
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4 text-primary">Veterinary Surgery Case Tracker</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to access your surgery cases and manage patient records.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show recovery screen if backend connection fails or times out
  if (isAuthenticated && (backendError || startupTimeout) && !isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <StartupRecoveryScreen
            error={backendError || 'Backend connection is taking longer than expected'}
            onRetry={handleRetry}
            onReload={handleReload}
            isRetrying={backendInitializing}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <SyncStatusBar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-primary">Surgery Cases</h1>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddCase} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Case
            </Button>
            <CsvImportDialog />
            <CsvExportButton />
          </div>
        </div>

        <div className="mb-4">
          <SortControls
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={setSortField}
            onSortDirectionChange={setSortDirection}
          />
        </div>

        <CaseList
          sortField={sortField}
          sortDirection={sortDirection}
          onEditCase={handleEditCase}
        />
      </main>

      <Footer />

      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome!</DialogTitle>
            <DialogDescription>Please enter your name to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Dr. Smith"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && profileName.trim()) {
                    handleSaveProfile();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!profileName.trim() || saveProfile.isPending}
              className="w-full"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCaseFormModal} onOpenChange={setShowCaseFormModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCaseId ? 'Edit Case' : 'Add New Case'}</DialogTitle>
          </DialogHeader>
          <CaseForm 
            editingCaseId={editingCaseId} 
            onCancelEdit={handleCloseCaseForm}
            onSaveComplete={handleSaveComplete}
          />
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
