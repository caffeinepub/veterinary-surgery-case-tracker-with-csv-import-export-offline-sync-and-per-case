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
    
    // Enhanced development-only logging
    console.group('🔴 Modal Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    if (errorInfo.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
    
    console.log('Reset key:', resetKey);
    console.log('Debug label:', debugLabel);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  componentDidUpdate(prevProps: ModalErrorBoundaryProps) {
    // Reset error state when resetKey changes (e.g., modal reopens)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      console.log('ModalErrorBoundary: Resetting error state due to resetKey change', {
        oldKey: prevProps.resetKey,
        newKey: this.props.resetKey,
        debugLabel: this.props.debugLabel,
      });
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
