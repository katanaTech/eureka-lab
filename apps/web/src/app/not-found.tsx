import { Button } from '@/components/ui/button';

/**
 * Custom 404 page — shown when a route doesn't exist.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-2 text-xl font-semibold text-foreground">
          Page Not Found
        </p>
        <p className="mt-1 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <a href="/">
        <Button>Go Home</Button>
      </a>
    </div>
  );
}
