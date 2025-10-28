import { Skeleton } from './Skeleton';

/**
 * Skeleton pour une carte d'élection (ElectionCard)
 * S'affiche pendant le chargement de la liste des élections
 */
export const SkeletonCard = () => {
  return (
    <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl overflow-hidden">
      {/* Image skeleton */}
      <Skeleton height="200px" rounded="sm" />
      
      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Badge statut */}
        <div className="flex items-center justify-between">
          <Skeleton width="80px" height="24px" rounded="full" />
          <Skeleton width="60px" height="20px" rounded="md" />
        </div>

        {/* Titre */}
        <Skeleton height="28px" width="80%" rounded="md" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton height="16px" width="100%" rounded="md" />
          <Skeleton height="16px" width="90%" rounded="md" />
        </div>

        {/* Informations (dates, votes, etc.) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Skeleton width="120px" height="20px" rounded="md" />
          <Skeleton width="100px" height="20px" rounded="md" />
          <Skeleton width="80px" height="20px" rounded="md" />
        </div>

        {/* Divider */}
        <div className="border-t border-secondary my-4"></div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton width="100px" height="20px" rounded="md" />
          <div className="flex gap-2">
            <Skeleton width="120px" height="40px" rounded="lg" />
            <Skeleton width="120px" height="40px" rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
