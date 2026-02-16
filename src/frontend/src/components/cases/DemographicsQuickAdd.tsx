import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { extractDemographics } from '../../utils/demographicsExtract';

interface DemographicsQuickAddProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (extractedData: any) => void;
}

export default function DemographicsQuickAdd({ 
  value, 
  onChange,
  onPaste
}: DemographicsQuickAddProps) {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Synchronously capture the pasted text during the paste event
    const pastedText = e.clipboardData.getData('text');
    
    // Allow default paste behavior to continue
    // Then trigger extraction with the captured text
    if (pastedText && onPaste) {
      // Use setTimeout to allow the textarea value to update first
      setTimeout(() => {
        const extracted = extractDemographics(pastedText);
        onPaste(extracted);
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="demographics">Quick Add Demographics</Label>
      <Textarea
        id="demographics"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste patient demographics here - fields will auto-fill from the text"
        rows={4}
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Paste demographics text and the form will automatically extract patient information
      </p>
    </div>
  );
}
