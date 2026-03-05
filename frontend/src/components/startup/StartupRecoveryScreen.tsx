import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, RefreshCw, RotateCw } from 'lucide-react';

interface StartupRecoveryScreenProps {
  error: string;
  onRetry: () => void;
  onReload: () => void;
  isRetrying?: boolean;
}

export default function StartupRecoveryScreen({ 
  error, 
  onRetry, 
  onReload, 
  isRetrying = false 
}: StartupRecoveryScreenProps) {
  // Determine if this is a token-related error
  const isTokenError = error.toLowerCase().includes('admin token') || 
                       error.toLowerCase().includes('draft url');

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Connection Issue
        </CardTitle>
        <CardDescription>
          We're having trouble connecting to the backend service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
        
        <div className="text-sm text-muted-foreground space-y-2">
          {isTokenError ? (
            <>
              <p className="font-medium text-foreground">Draft Environment Setup Required:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Make sure you're using the Draft URL provided by Caffeine</li>
                <li>The URL should contain the admin token parameter</li>
                <li>Do not manually edit or remove URL parameters</li>
              </ul>
              <p className="mt-3">
                If you've lost the Draft URL, please contact support or redeploy your application.
              </p>
            </>
          ) : (
            <>
              <p>This could be due to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Network connectivity issues</li>
                <li>Backend service temporarily unavailable</li>
                <li>Authorization or permission problems</li>
                <li>Browser security settings blocking the connection</li>
              </ul>
              <p className="mt-3">
                Please check your internet connection and try again.
              </p>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex-1 gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </>
          )}
        </Button>
        <Button
          onClick={onReload}
          variant="outline"
          disabled={isRetrying}
          className="flex-1 gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Reload Page
        </Button>
      </CardFooter>
    </Card>
  );
}
