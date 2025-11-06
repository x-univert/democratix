import { Skeleton } from './Skeleton';

/**
 * Skeleton pour la page Profile
 * S'affiche pendant le chargement du profil utilisateur
 */
export const SkeletonProfile = () => {
  return (
    <div className="space-y-6">
      {/* Header avec avatar et infos */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <Skeleton height="120px" width="120px" rounded="full" className="flex-shrink-0" />

          {/* Infos utilisateur */}
          <div className="flex-1 space-y-4 w-full">
            <Skeleton height="32px" width="60%" rounded="md" />
            <Skeleton height="20px" width="80%" rounded="md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton height="28px" width="100px" rounded="full" />
              <Skeleton height="28px" width="120px" rounded="full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats utilisateur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
            <Skeleton height="20px" width="70%" rounded="md" className="mb-3" />
            <Skeleton height="36px" width="80px" rounded="md" className="mb-2" />
            <Skeleton height="16px" width="100%" rounded="md" />
          </div>
        ))}
      </div>

      {/* Historique de votes */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 sm:p-6">
        <Skeleton height="28px" width="250px" rounded="md" className="mb-6" />

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-primary border-2 border-secondary rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton height="20px" width="70%" rounded="md" />
                  <Skeleton height="16px" width="50%" rounded="md" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton height="24px" width="80px" rounded="full" />
                  <Skeleton height="36px" width="100px" rounded="lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Élections organisées */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 sm:p-6">
        <Skeleton height="28px" width="300px" rounded="md" className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-primary border-2 border-secondary rounded-lg p-4">
              <Skeleton height="150px" rounded="lg" className="mb-3" />
              <Skeleton height="20px" width="80%" rounded="md" className="mb-2" />
              <Skeleton height="16px" width="100%" rounded="md" className="mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton height="24px" width="70px" rounded="full" />
                <Skeleton height="16px" width="80px" rounded="md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
