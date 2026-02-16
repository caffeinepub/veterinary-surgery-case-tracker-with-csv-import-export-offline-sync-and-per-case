import { useState } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import CameraCapture from './CameraCapture';

interface DemographicsQuickAddProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DemographicsQuickAdd({ value, onChange }: DemographicsQuickAddProps) {
  const [showCamera, setShowCamera] = useState(false);

  const handleCaptureComplete = () => {
    setShowCamera(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="demographics">Quick Add Demographics</Label>
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Capture from Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Capture Demographics</DialogTitle>
            </DialogHeader>
            <CameraCapture onCaptureComplete={handleCaptureComplete} />
          </DialogContent>
        </Dialog>
      </div>
      <Textarea
        id="demographics"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste patient demographics here (e.g., from a form or document)"
        rows={4}
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Paste demographics text or use the camera to capture a reference image
      </p>
    </div>
  );
}
