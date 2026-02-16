import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useEnvironmentLabel } from '../../hooks/useEnvironmentLabel';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Stethoscope } from 'lucide-react';
import { clearLocalCases } from '../../utils/localPersistence';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const environmentLabel = useEnvironmentLabel();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      clearLocalCases();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary">VetCase Tracker</h1>
              {isAuthenticated && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-normal bg-muted/50"
                >
                  {environmentLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Surgery Case Management</p>
          </div>
        </div>
        <Button
          onClick={handleAuth}
          disabled={disabled}
          variant={isAuthenticated ? 'outline' : 'default'}
          size="sm"
        >
          {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {text}
        </Button>
      </div>
    </header>
  );
}
