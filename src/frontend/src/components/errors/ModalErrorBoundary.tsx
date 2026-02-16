import React, { Component, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

interface ModalErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
  resetKey?: string | number | null;
  debugLabel?: string;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  constructor(props: ModalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { resetKey, debugLabel } = this.props;
    
    // Enhanced development-focused logging with clear context
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Modal Error Boundary - Error Details');
      console.error('Modal:', debugLabel || 'Unknown');
      console.error('Reset Key:', resetKey);
      console.error('Timestamp:', new Date().toISOString());
      console.error('');
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('');
      
      if (error.stack) {
        console.error('Error Stack Trace:');
        console.error(error.stack);
        console.error('');
      }
      
      if (errorInfo.componentStack) {
        console.error('React Component Stack:');
        console.error(errorInfo.componentStack);
      }
      
      console.groupEnd();
    } else {
      // Production: minimal logging
      console.error('Modal error:', error.message);
    }
  }

  componentDidUpdate(prevProps: ModalErrorBoundaryProps) {
    // Reset error state when resetKey changes (e.g., modal reopens)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ModalErrorBoundary: Resetting error state', {
          debugLabel: this.props.debugLabel,
          oldKey: prevProps.resetKey,
          newKey: this.props.resetKey,
        });
      }
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An error occurred while loading this form. Please close and try again.
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs font-mono opacity-75">
                  {this.state.error.message}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <Button onClick={this.props.onClose} className="w-full">
            Close
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
