import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { dateOnlyStringToLocalDate, localDateToDateOnlyString, validateDateOnlyString } from '../../utils/dates';

interface DateFieldProps {
  value: string; // YYYY-MM-DD string
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function DateField({ value, onChange, placeholder = 'Pick a date', disabled }: DateFieldProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);

  // Sync input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue) {
      const validated = validateDateOnlyString(newValue);
      if (validated) {
        onChange(validated);
      }
    } else {
      onChange('');
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = localDateToDateOnlyString(date);
      onChange(dateStr);
      setInputValue(dateStr);
      setIsOpen(false);
    }
  };

  // Convert string to Date for calendar highlighting
  const selectedDate = value ? dateOnlyStringToLocalDate(value) : null;

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn('w-10 p-0', !value && 'text-muted-foreground')}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
