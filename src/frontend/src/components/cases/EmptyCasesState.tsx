import { FolderOpen, AlertCircle, FileDown, FileUp, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface EmptyCasesStateProps {
  showMigrationGuidance: boolean;
}

export default function EmptyCasesState({ showMigrationGuidance }: EmptyCasesStateProps) {
  if (!showMigrationGuidance) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-6">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
        <p className="text-muted-foreground">Click the "Add Case" button to create your first case.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100 text-lg font-semibold mb-3">
          Draft and Live environments use separate storage
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-4">
          <p>
            Your cases from the Draft environment are not automatically available in the Live environment. 
            Each environment maintains its own independent data storage.
          </p>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
              To migrate your cases from Draft to Live:
            </h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                  1
                </span>
                <span className="pt-0.5">
                  Open the <strong>Draft app</strong> in your browser
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                  2
                </span>
                <span className="pt-0.5 flex items-center gap-1.5">
                  Click the <FileDown className="h-4 w-4 inline" /> <strong>CSV Export</strong> button to download your cases
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                  3
                </span>
                <span className="pt-0.5">
                  Return to the <strong>Live app</strong> (this environment)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                  4
                </span>
                <span className="pt-0.5 flex items-center gap-1.5">
                  Click the <FileUp className="h-4 w-4 inline" /> <strong>CSV Import</strong> button and select your exported file
                </span>
              </li>
            </ol>
          </div>

          <p className="text-sm italic">
            <ArrowRight className="h-4 w-4 inline mr-1" />
            After importing, your cases will be available in this Live environment.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
