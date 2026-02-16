import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCsv, csvRowToCase } from '../../utils/csv';
import { useCasesStore } from '../../hooks/useCasesStore';
import { toast } from 'sonner';
import type { LocalSurgeryCase } from '../../types/cases';

export default function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const { importCases } = useCasesStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const text = await selectedFile.text();
    const result = parseCsv(text);
    setParseResult(result);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.errors.length > 0) return;

    try {
      const cases: Partial<LocalSurgeryCase>[] = parseResult.rows.map((row: any, index: number) =>
        csvRowToCase(row, BigInt(Date.now() + index))
      );

      await importCases.mutateAsync(cases as LocalSurgeryCase[]);
      toast.success(`Imported ${cases.length} cases successfully`);
      setOpen(false);
      setFile(null);
      setParseResult(null);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import cases');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setParseResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Cases from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with the following columns: Medical Record #, Arrival Date, Pet Name, Species, Breed, 
              and any of the task columns: Discharge Notes, pDVM Notified, Labs, Histo, Surgery Report, Imaging, Culture.
            </p>
            <p className="text-sm text-muted-foreground">
              Task columns can be left empty (task not required) or contain Yes/No (task required and completion status).
            </p>
          </div>

          <Input type="file" accept=".csv" onChange={handleFileChange} />

          {parseResult && (
            <div className="space-y-3">
              {parseResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {parseResult.warnings.map((warning: string, index: number) => (
                        <p key={index} className="text-sm">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.errors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Found {parseResult.errors.length} error(s):</p>
                      {parseResult.errors.slice(0, 5).map((error: any, index: number) => (
                        <p key={index} className="text-sm">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <p className="text-sm">...and {parseResult.errors.length - 5} more</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Ready to import {parseResult.rows.length} case(s)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parseResult || parseResult.errors.length > 0 || importCases.isPending}
            >
              {importCases.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
