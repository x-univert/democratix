import { Skeleton } from './Skeleton';

/**
 * Skeleton pour la page de détails d'une élection
 * S'affiche pendant le chargement des détails
 */
export const SkeletonDetail = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Skeleton width="150px" height="40px" className="mb-4" rounded="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image principale */}
          <Skeleton height="400px" rounded="xl" />

          {/* Titre et description */}
          <div className="space-y-4">
            <Skeleton height="36px" width="70%" rounded="md" />
            <div className="space-y-2">
              <Skeleton height="20px" width="100%" rounded="md" />
              <Skeleton height="20px" width="95%" rounded="md" />
              <Skeleton height="20px" width="85%" rounded="md" />
            </div>
          </div>

          {/* Candidats */}
          <div className="space-y-4">
            <Skeleton height="28px" width="200px" rounded="md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-primary border-2 border-secondary rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <Skeleton width="64px" height="64px" rounded="full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height="20px" width="70%" rounded="md" />
                      <Skeleton height="16px" width="50%" rounded="md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations card */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 space-y-4">
            <Skeleton height="24px" width="150px" rounded="md" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton width="80px" height="16px" rounded="md" />
                <Skeleton width="100px" height="16px" rounded="md" />
              </div>
              <div className="flex justify-between">
                <Skeleton width="80px" height="16px" rounded="md" />
                <Skeleton width="100px" height="16px" rounded="md" />
              </div>
              <div className="flex justify-between">
                <Skeleton width="80px" height="16px" rounded="md" />
                <Skeleton width="100px" height="16px" rounded="md" />
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 space-y-4">
            <Skeleton height="24px" width="120px" rounded="md" />
            <div className="space-y-3">
              <Skeleton height="60px" rounded="lg" />
              <Skeleton height="60px" rounded="lg" />
              <Skeleton height="60px" rounded="lg" />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <Skeleton height="48px" rounded="lg" />
            <Skeleton height="48px" rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
