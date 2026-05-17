import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 text-primary animate-spin" style={{
        filter: 'drop-shadow(0 0 8px hsl(var(--primary)))'
      }} />
    </div>
  );
};
