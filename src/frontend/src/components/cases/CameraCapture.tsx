import { useEffect } from 'react';
import { useCamera } from '../../camera/useCamera';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCaptureComplete: () => void;
}

export default function CameraCapture({ onCaptureComplete }: CameraCaptureProps) {
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
    currentFacingMode,
  } = useCamera({
    facingMode: 'environment',
    quality: 0.9,
  });

  useEffect(() => {
    return () => {
      if (isActive) {
        stopCamera();
      }
    };
  }, [isActive, stopCamera]);

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      toast.success('Photo captured successfully');
      onCaptureComplete();
    } else {
      toast.error('Failed to capture photo');
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
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px', aspectRatio: '4/3' }}>
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
          <Button onClick={startCamera} disabled={isLoading}>
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
            <Button onClick={handleCapture} disabled={isLoading}>
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
            <Button onClick={stopCamera} variant="outline" disabled={isLoading}>
              Stop Camera
            </Button>
            {typeof window !== 'undefined' && !window.navigator.userAgent.includes('Mobile') && (
              <Button onClick={() => switchCamera()} variant="outline" disabled={isLoading}>
                <RotateCw className="mr-2 h-4 w-4" />
                Switch Camera
              </Button>
            )}
          </>
        )}

        {error && (
          <Button onClick={retry} variant="outline">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
