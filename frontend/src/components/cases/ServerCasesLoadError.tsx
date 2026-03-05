import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { classifyBackendError } from '../../utils/backendErrorMessages';
import AuthorizationRecoveryBanner from '../auth/AuthorizationRecoveryBanner';

interface ServerCasesLoadErrorProps {
  error: unknown;
  onRetry: () => void;
}

export default function ServerCasesLoadError({ error, onRetry }: ServerCasesLoadErrorProps) {
  const classified = classifyBackendError(error);

  // If it's an authorization error, show the recovery banner instead
  if (classified.category === 'authorization') {
    return <AuthorizationRecoveryBanner error={error} onSuccess={onRetry} />;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Server Cases Loading Failed</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{classified.message}</p>
        <div className="flex items-center gap-3">
          <Button onClick={onRetry} variant="outline" size="sm">
            Retry
          </Button>
          <span className="text-xs text-muted-foreground">
            Local cases are still available below
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
