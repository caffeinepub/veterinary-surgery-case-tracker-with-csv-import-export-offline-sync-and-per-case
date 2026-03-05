import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useSync } from '../../hooks/useSync';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Server, ServerOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SyncStatusBar() {
  const isOnline = useOnlineStatus();
  const { identity } = useInternetIdentity();
  const { isConnected, isInitializing, error: connectionError, retry: retryConnection } = useBackendConnection();
  const { sync, isSyncing, syncError } = useSync();

  const isAuthenticated = !!identity;

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    if (!isConnected) {
      toast.error('Cannot sync: Not connected to backend');
      return;
    }

    const success = await sync();
    if (success) {
      toast.success('Sync completed successfully');
    } else {
      // Use the friendly error message from syncError if available
      const errorMessage = syncError || 'Sync failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleRetry = async () => {
    await retryConnection();
    toast.info('Retrying backend connection...');
  };

  // Show sync error only (connection errors are now shown in the main troubleshooting banner)
  const showSyncError = syncError && !connectionError;

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Browser online/offline status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Offline</span>
                </>
              )}
            </div>

            {/* Backend connection status (only for authenticated users) */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {isInitializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Connecting...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Server className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Backend Connected</span>
                  </>
                ) : (
                  <>
                    <ServerOff className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Backend Disconnected</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sync button */}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || !isConnected || isSyncing || isInitializing}
                className="gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Sync error alert (connection errors are shown in the main troubleshooting banner) */}
        {showSyncError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sync Error:</strong> {syncError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
