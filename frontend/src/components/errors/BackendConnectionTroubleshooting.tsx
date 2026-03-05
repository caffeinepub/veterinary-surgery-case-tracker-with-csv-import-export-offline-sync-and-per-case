import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface BackendConnectionTroubleshootingProps {
  error: string;
  onRetry: () => Promise<void>;
  isRetrying?: boolean;
}

/**
 * Prominent troubleshooting banner for authenticated users when backend connection fails.
 * Provides actionable guidance including hints about frontend bindings and canister ID sync.
 */
export default function BackendConnectionTroubleshooting({
  error,
  onRetry,
  isRetrying = false,
}: BackendConnectionTroubleshootingProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Backend Connection Error</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{error}</p>
        
        <div className="text-sm space-y-2">
          <p className="font-medium">Troubleshooting steps:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check that your internet connection is working</li>
            <li>Verify the backend canister is deployed and running</li>
            <li>
              If you recently redeployed the backend, the frontend may be using outdated bindings.
              Try redeploying the frontend with fresh backend bindings (see{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">frontend/DEPLOYMENT_NOTES.md</code>)
            </li>
            <li>Clear your browser cache and reload the page</li>
          </ul>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
          >
            <a
              href="https://github.com/dfinity/examples/tree/master/motoko"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              IC Documentation
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
