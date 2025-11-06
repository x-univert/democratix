import { Skeleton } from './Skeleton';

/**
 * Skeleton pour le Dashboard Admin
 * S'affiche pendant le chargement des statistiques
 */
export const SkeletonDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 sm:p-6 lg:p-8">
        <Skeleton height="36px" width="60%" rounded="md" className="mb-4" />
        <Skeleton height="20px" width="80%" rounded="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4">
            <Skeleton height="20px" width="80%" rounded="md" className="mb-3" />
            <Skeleton height="32px" width="60px" rounded="md" className="mb-2" />
            <Skeleton height="16px" width="100%" rounded="md" />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
          <Skeleton height="24px" width="50%" rounded="md" className="mb-4" />
          <Skeleton height="300px" rounded="lg" />
        </div>

        {/* Chart 2 */}
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
          <Skeleton height="24px" width="50%" rounded="md" className="mb-4" />
          <Skeleton height="300px" rounded="lg" />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
        <Skeleton height="24px" width="200px" rounded="md" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-primary border-2 border-secondary rounded-lg">
              <Skeleton height="40px" width="40px" rounded="md" className="mb-2" />
              <Skeleton height="20px" width="80%" rounded="md" className="mb-1" />
              <Skeleton height="16px" width="100%" rounded="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Elections */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
        <Skeleton height="24px" width="300px" rounded="md" className="mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-primary border-2 border-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton height="20px" width="200px" rounded="md" />
                <Skeleton height="24px" width="80px" rounded="full" />
              </div>
              <Skeleton height="16px" width="60%" rounded="md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
