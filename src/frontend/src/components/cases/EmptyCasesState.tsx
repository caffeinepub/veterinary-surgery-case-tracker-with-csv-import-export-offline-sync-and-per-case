import { FolderOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface EmptyCasesStateProps {
  showMigrationGuidance: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
}

export default function EmptyCasesState({ showMigrationGuidance, isConnected, isAuthenticated }: EmptyCasesStateProps) {
  // Determine data source message
  let dataSourceMessage = '';
  if (isAuthenticated && isConnected) {
    dataSourceMessage = 'Connected—no cases found on server yet';
  } else if (isAuthenticated && !isConnected) {
    dataSourceMessage = 'Showing locally saved cases';
  } else {
    dataSourceMessage = 'No cases yet';
  }

  if (!showMigrationGuidance) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-6">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
        <p className="text-muted-foreground mb-1">Import a CSV file to get started</p>
        <p className="text-sm text-muted-foreground/70 mt-2">{dataSourceMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Alert>
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold mb-3">Moving from Draft to Live?</AlertTitle>
        <AlertDescription className="space-y-4">
          <p className="text-sm">
            Draft and Live environments maintain separate data. If you have cases in your Draft environment
            that you'd like to bring to Live, follow these steps:
          </p>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                1
              </div>
              <div>
                <p className="font-medium mb-1">Export from Draft</p>
                <p className="text-muted-foreground">
                  Open your Draft environment and click the "Export CSV" button to download all your cases
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                2
              </div>
              <div>
                <p className="font-medium mb-1">Import to Live</p>
                <p className="text-muted-foreground">
                  Return here (Live) and click "Import CSV" to upload the file you just exported
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This is a one-time migration. After importing, you can edit existing cases
              or import additional CSV files as needed.
            </p>
          </div>

          <p className="text-sm text-muted-foreground/70 pt-2">{dataSourceMessage}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
