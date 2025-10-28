/**
 * Composant Skeleton de base
 * Affiche un rectangle animé gris qui "pulse" pendant le chargement
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Skeleton = ({ 
  className = '', 
  width, 
  height,
  rounded = 'md' 
}: SkeletonProps) => {
  const roundedClass = {
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    'full': 'rounded-full'
  }[rounded];

  return (
    <div
      className={`bg-secondary animate-pulse skeleton-shimmer ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};
