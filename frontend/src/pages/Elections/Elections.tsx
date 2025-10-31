import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useGetElections, type Election } from 'hooks/elections';
import { ElectionCard } from '../../components/ElectionCard';
import { SkeletonCard } from '../../components/Skeleton';
import { ipfsService } from '../../services/ipfsService';

type FilterStatus = 'all' | 'Pending' | 'Active' | 'Closed' | 'Finalized';
type FilterCategory = 'all' | 'presidential' | 'legislative' | 'local' | 'referendum' | 'association' | 'other';

export const Elections = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getElections } = useGetElections();
  const { t } = useTranslation();

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [electionsMetadata, setElectionsMetadata] = useState<Record<number, any>>({});
  const isFirstRenderRef = useRef(true);

  // Lire le numéro de page depuis l'URL
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchElections = async () => {
      setLoading(true);
      try {
        const data = await getElections();
        setElections(data || []);

        // Charger les métadonnées IPFS pour chaque élection
        const metadataPromises = (data || []).map(async (election) => {
          try {
            if (!election.description_ipfs || !ipfsService.isValidIPFSHash(election.description_ipfs)) {
              return { id: election.id, metadata: null };
            }
            const metadata = await ipfsService.fetchElectionMetadata(election.description_ipfs);
            return { id: election.id, metadata };
          } catch (err) {
            console.error(`Erreur lors du chargement des métadonnées pour l'élection ${election.id}:`, err);
            return { id: election.id, metadata: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        const metadataMap: Record<number, any> = {};
        results.forEach(({ id, metadata }) => {
          metadataMap[id] = metadata;
        });
        setElectionsMetadata(metadataMap);
      } catch (error) {
        console.error('Erreur lors de la récupération des élections:', error);
        setElections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const filteredElections = useMemo(() => {
    let filtered = elections;

    if (filterStatus !== 'all') {
      // Utiliser directement le statut blockchain
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      // Filtrer par catégorie IPFS
      filtered = filtered.filter(e => {
        const metadata = electionsMetadata[e.id];
        return metadata?.metadata?.category === filterCategory;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [elections, filterStatus, filterCategory, searchQuery, electionsMetadata]);

  const totalPages = Math.ceil(filteredElections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedElections = filteredElections.slice(startIndex, startIndex + itemsPerPage);

  // Synchroniser currentPage avec l'URL quand l'URL change (ex: bouton retour du navigateur)
  useEffect(() => {
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl]);

  // Synchroniser l'URL avec currentPage quand on change de page via les boutons
  useEffect(() => {
    const pageInUrl = parseInt(searchParams.get('page') || '1', 10);

    // Ne mettre à jour l'URL que si elle est différente
    if (pageInUrl !== currentPage) {
      if (currentPage === 1) {
        searchParams.delete('page');
        setSearchParams(searchParams, { replace: true });
      } else {
        searchParams.set('page', currentPage.toString());
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [currentPage]);

  // Réinitialiser la page à 1 quand on change les filtres (mais pas au premier render)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [filterStatus, filterCategory, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: elections.length,
      pending: elections.filter(e => e.status === 'Pending').length,
      active: elections.filter(e => e.status === 'Active').length,
      closed: elections.filter(e => e.status === 'Closed').length,
      finalized: elections.filter(e => e.status === 'Finalized').length
    };
  }, [elections]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="w-full md:w-auto">
            <div className="h-10 w-64 bg-secondary animate-pulse rounded-lg mb-2"></div>
            <div className="h-6 w-96 bg-secondary animate-pulse rounded-md"></div>
          </div>
          <div className="h-12 w-48 bg-secondary animate-pulse rounded-lg"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-secondary border-2 border-secondary rounded-xl p-4">
              <div className="h-8 w-16 bg-tertiary animate-pulse rounded-md mb-2"></div>
              <div className="h-4 w-20 bg-tertiary animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="h-12 flex-1 bg-secondary animate-pulse rounded-lg"></div>
          <div className="h-12 w-full md:w-64 bg-secondary animate-pulse rounded-lg"></div>
          <div className="h-12 w-full md:w-64 bg-secondary animate-pulse rounded-lg"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">{t('elections.title')}</h1>
          <p className="text-secondary text-lg">
            {t('elections.subtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate(RouteNamesEnum.createElection)}
          className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold flex items-center gap-2 shadow-md btn-create-election"
        >
          <span className="text-2xl font-bold leading-none">+</span>
          {t('elections.createElection')}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-primary mb-2">{stats.total}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('elections.stats.total')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-accent mb-2">{stats.pending}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('elections.stats.pending')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-success mb-2">{stats.active}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('elections.stats.active')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-secondary mb-2">{stats.closed}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('elections.stats.closed')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-accent mb-2">{stats.finalized}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('elections.stats.finalized')}</span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Barre de recherche */}
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder={t('elections.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-secondary border-2 border-secondary vibe-border text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary text-2xl leading-none"
              aria-label={t('elections.clearSearch') || 'Clear search'}
              type="button"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtre de catégorie - Menu déroulant */}
        <div className="w-full md:w-64">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
            className="w-full px-4 py-3 bg-secondary border-2 border-secondary vibe-border text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all font-medium cursor-pointer"
          >
            <option value="all">{t('elections.categoryFilters.all')}</option>
            <option value="presidential">{t('elections.categoryFilters.presidential')}</option>
            <option value="legislative">{t('elections.categoryFilters.legislative')}</option>
            <option value="local">{t('elections.categoryFilters.local')}</option>
            <option value="referendum">{t('elections.categoryFilters.referendum')}</option>
            <option value="association">{t('elections.categoryFilters.association')}</option>
            <option value="other">{t('elections.categoryFilters.other')}</option>
          </select>
        </div>

        {/* Filtre de statut - Menu déroulant */}
        <div className="w-full md:w-64">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="w-full px-4 py-3 bg-secondary border-2 border-secondary vibe-border text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all font-medium cursor-pointer"
          >
            <option value="all">{t('elections.filters.all')}</option>
            <option value="Pending">{t('elections.filters.pending')}</option>
            <option value="Active">{t('elections.filters.active')}</option>
            <option value="Closed">{t('elections.filters.closed')}</option>
            <option value="Finalized">{t('elections.filters.finalized')}</option>
          </select>
        </div>
      </div>


      {/* Résultats */}
      {filteredElections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-24 h-24 text-secondary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-primary mb-2">{t('elections.noElections')}</h2>
          <p className="text-secondary mb-6 text-center max-w-md">
            {searchQuery || filterStatus !== 'all'
              ? t('elections.noElectionsSubtitle')
              : t('elections.noElectionsEmpty')}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={() => navigate(RouteNamesEnum.createElection)}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold btn-create-election"
            >
              {t('elections.createElection')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grille d'élections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-2 bg-secondary text-secondary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('elections.pagination.previous')}
                type="button"
              >
                ← {t('elections.pagination.previous')}
              </button>

              <div className="flex gap-2 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-btn-primary text-btn-primary shadow-md'
                        : 'bg-secondary text-secondary border-2 border-secondary vibe-border hover:bg-tertiary'
                    }`}
                    aria-label={`${t('elections.pagination.goToPage')} ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    type="button"
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-6 py-2 bg-secondary text-secondary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('elections.pagination.next')}
                type="button"
              >
                {t('elections.pagination.next')} →
              </button>
            </div>
          )}

          {/* Info pagination */}
          <div className="text-center text-sm text-secondary">
            {t('elections.pagination.showing', {
              start: startIndex + 1,
              end: Math.min(startIndex + itemsPerPage, filteredElections.length),
              total: filteredElections.length
            })}{filteredElections.length > 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
};
