import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Camera, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import CameraCapture from './CameraCapture';

interface DemographicsQuickAddProps {
  value: string;
  onChange: (value: string) => void;
  capturedImageUrl?: string;
  onCapturedImageChange: (url: string | undefined) => void;
}

export default function DemographicsQuickAdd({ 
  value, 
  onChange, 
  capturedImageUrl,
  onCapturedImageChange 
}: DemographicsQuickAddProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Reset camera state when dialog closes
  useEffect(() => {
    if (!showCamera) {
      setCameraError(null);
    }
  }, [showCamera]);

  const handleCaptureComplete = (imageUrl: string) => {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL');
      }
      onCapturedImageChange(imageUrl);
      setShowCamera(false);
      setCameraError(null);
    } catch (err) {
      console.error('Error handling captured image:', err);
      setCameraError('Failed to save captured image');
    }
  };

  const handleRemoveImage = () => {
    try {
      if (capturedImageUrl && capturedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(capturedImageUrl);
      }
      onCapturedImageChange(undefined);
    } catch (err) {
      console.error('Error removing image:', err);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setShowCamera(open);
    if (!open) {
      setCameraError(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="demographics">Quick Add Demographics</Label>
        <Dialog open={showCamera} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              {capturedImageUrl ? 'Replace Image' : 'Capture from Camera'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Capture Demographics</DialogTitle>
            </DialogHeader>
            {cameraError ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
                <Button onClick={() => handleOpenChange(false)} className="w-full">
                  Close
                </Button>
              </div>
            ) : (
              showCamera && <CameraCapture onCaptureComplete={handleCaptureComplete} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {capturedImageUrl && (
        <div className="relative border rounded-lg p-2 bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <img 
                src={capturedImageUrl} 
                alt="Captured demographics" 
                className="w-32 h-24 object-cover rounded border"
                onError={(e) => {
                  console.error('Error loading captured image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Reference Image Captured</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This image is stored locally as a reference for patient demographics
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
