import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { useCasesStore } from '../../hooks/useCasesStore';
import { casesToCsv } from '../../utils/csv';
import { toast } from 'sonner';

export default function CsvExportButton() {
  const { cases } = useCasesStore();

  const handleExport = () => {
    if (cases.length === 0) {
      toast.error('No cases to export');
      return;
    }

    try {
      const csvContent = casesToCsv(cases);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vet-cases-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${cases.length} cases`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={cases.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
