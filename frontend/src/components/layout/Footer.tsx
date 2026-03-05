import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'vetcase-tracker'
  );

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          © {currentYear} VetCase Tracker. Built with{' '}
          <Heart className="h-4 w-4 text-primary fill-primary" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
