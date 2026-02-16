import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSync } from '../../hooks/useSync';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SyncStatusBar() {
  const isOnline = useOnlineStatus();
  const { sync, isSyncing, syncError } = useSync();

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    const success = await sync();
    if (success) {
      toast.success('Sync completed successfully');
    } else {
      toast.error('Sync failed. Please try again.');
    }
  };

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center justify-between">
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
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
        </div>

        {syncError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
