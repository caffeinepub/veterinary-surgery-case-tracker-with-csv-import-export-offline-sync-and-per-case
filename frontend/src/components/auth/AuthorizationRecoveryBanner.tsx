import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { useGrantUserAccess } from '../../hooks/useQueries';
import { classifyBackendError } from '../../utils/backendErrorMessages';

interface AuthorizationRecoveryBannerProps {
  error: unknown;
  onSuccess?: () => void;
}

export default function AuthorizationRecoveryBanner({ error, onSuccess }: AuthorizationRecoveryBannerProps) {
  const grantAccess = useGrantUserAccess();
  const classified = classifyBackendError(error);

  // Only show this banner for authorization errors
  if (classified.category !== 'authorization') {
    return null;
  }

  const handleGrantAccess = async () => {
    try {
      await grantAccess.mutateAsync();
      // The mutation's onSuccess already refetches queries
      // Call the success callback to trigger any additional UI updates
      onSuccess?.();
    } catch (err) {
      console.error('Failed to grant user access:', err);
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Access Permission Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          You need user permission to access this application. Click the button below to grant yourself access.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGrantAccess}
            disabled={grantAccess.isPending || grantAccess.isSuccess}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {grantAccess.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {grantAccess.isSuccess && <CheckCircle2 className="h-3 w-3" />}
            {grantAccess.isPending ? 'Granting Access...' : grantAccess.isSuccess ? 'Access Granted' : 'Grant User Access'}
          </Button>
          {grantAccess.isError && (
            <span className="text-xs text-destructive">
              Failed to grant access. Please try again.
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
