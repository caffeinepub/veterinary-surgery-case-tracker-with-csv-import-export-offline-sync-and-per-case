import { useEffect, useRef } from 'react';
import { useCamera } from '../../camera/useCamera';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCaptureComplete: (imageUrl: string) => void;
}

export default function CameraCapture({ onCaptureComplete }: CameraCaptureProps) {
  const isMountedRef = useRef(true);
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    quality: 0.9,
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Cleanup camera on unmount
      if (isActive) {
        stopCamera().catch((err) => {
          console.error('Error stopping camera on unmount:', err);
        });
      }
    };
  }, [isActive, stopCamera]);

  const handleCapture = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const photo = await capturePhoto();
      if (!isMountedRef.current) return;
      
      if (photo) {
        // Convert File to data URL for local storage
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!isMountedRef.current) return;
          const dataUrl = reader.result as string;
          if (dataUrl && typeof dataUrl === 'string') {
            toast.success('Photo captured successfully');
            onCaptureComplete(dataUrl);
          } else {
            toast.error('Failed to process captured photo');
          }
        };
        reader.onerror = () => {
          if (!isMountedRef.current) return;
          toast.error('Failed to process captured photo');
        };
        reader.readAsDataURL(photo);
      } else {
        toast.error('Failed to capture photo');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error capturing photo:', err);
      toast.error('Failed to capture photo');
    }
  };

  const handleStartCamera = async () => {
    if (!isMountedRef.current) return;
    try {
      await startCamera();
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error starting camera:', err);
      toast.error('Failed to start camera');
    }
  };

  const handleStopCamera = async () => {
    if (!isMountedRef.current) return;
    try {
      await stopCamera();
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error stopping camera:', err);
      toast.error('Failed to stop camera');
    }
  };

  const handleSwitchCamera = async () => {
    if (!isMountedRef.current) return;
    try {
      await switchCamera();
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error switching camera:', err);
      toast.error('Failed to switch camera');
    }
  };

  const handleRetry = async () => {
    if (!isMountedRef.current) return;
    try {
      await retry();
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error retrying camera:', err);
      toast.error('Failed to retry camera');
    }
  };

  if (isSupported === false) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Camera is not supported on this device or browser.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="relative bg-black rounded-lg overflow-hidden" 
        style={{ minHeight: '400px', height: '400px', aspectRatio: '4/3' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isActive ? 'block' : 'none' }}
        />
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white">Camera preview will appear here</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
            {error.type === 'permission' && ' Please grant camera permissions and try again.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        {!isActive && !error && (
          <Button type="button" onClick={handleStartCamera} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </>
            )}
          </Button>
        )}

        {isActive && (
          <>
            <Button type="button" onClick={handleCapture} disabled={isLoading}>
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
            <Button type="button" onClick={handleStopCamera} variant="outline" disabled={isLoading}>
              Stop Camera
            </Button>
            {typeof window !== 'undefined' && !window.navigator.userAgent.includes('Mobile') && (
              <Button type="button" onClick={handleSwitchCamera} variant="outline" disabled={isLoading}>
                <RotateCw className="mr-2 h-4 w-4" />
                Switch Camera
              </Button>
            )}
          </>
        )}

        {error && (
          <Button type="button" onClick={handleRetry} variant="outline">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
