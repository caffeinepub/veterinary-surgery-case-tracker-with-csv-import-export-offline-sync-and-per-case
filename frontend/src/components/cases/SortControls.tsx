import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { ArrowUpDown } from 'lucide-react';

interface SortControlsProps {
  sortField: 'arrivalDate' | 'medicalRecordNumber';
  sortDirection: 'asc' | 'desc';
  onSortFieldChange: (field: 'arrivalDate' | 'medicalRecordNumber') => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

export default function SortControls({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}: SortControlsProps) {
  const toggleDirection = () => {
    onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Label htmlFor="sortField" className="text-sm whitespace-nowrap">
          Sort by:
        </Label>
        <Select value={sortField} onValueChange={(value: any) => onSortFieldChange(value)}>
          <SelectTrigger id="sortField" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arrivalDate">Arrival Date</SelectItem>
            <SelectItem value="medicalRecordNumber">Medical Record #</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={toggleDirection}>
        <ArrowUpDown className="h-4 w-4 mr-2" />
        {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      </Button>
    </div>
  );
}
