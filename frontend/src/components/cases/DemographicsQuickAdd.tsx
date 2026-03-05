import { useRef } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { extractDemographics, type ExtractedDemographics } from '../../utils/demographicsExtract';

interface DemographicsQuickAddProps {
  onPaste: (extracted: ExtractedDemographics) => void;
}

export default function DemographicsQuickAdd({ onPaste }: DemographicsQuickAddProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Get pasted text synchronously during the paste event
    const pastedText = e.clipboardData.getData('text');
    
    if (pastedText) {
      // Extract demographics from pasted text
      const extracted = extractDemographics(pastedText);
      
      // Trigger callback with extracted data
      onPaste(extracted);
      
      // Clear the textarea after extraction
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = '';
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <Label htmlFor="quickAdd" className="text-blue-900 dark:text-blue-100">
        Quick Add Demographics
      </Label>
      <Textarea
        ref={textareaRef}
        id="quickAdd"
        placeholder="Paste patient demographics here (MRN, name, owner, species, breed, sex, DOB, arrival date, presenting complaint)..."
        onPaste={handlePaste}
        rows={3}
        className="bg-white dark:bg-gray-900"
      />
      <p className="text-xs text-blue-700 dark:text-blue-300">
        Paste demographics text to auto-fill form fields
      </p>
    </div>
  );
}
