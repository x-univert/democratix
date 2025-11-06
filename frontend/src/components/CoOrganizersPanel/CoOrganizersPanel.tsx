import React, { useState, useEffect } from 'react';
import { useGetAccount } from 'lib';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ConfirmModal } from '../ConfirmModal';

interface CoOrganizer {
  address: string;
  addedAt: number;
  addedBy: string;
  permissions: {
    canSetupEncryption: boolean;
    canDecryptVotes: boolean;
    canAddCoOrganizers: boolean;
  };
}

interface ElectionOrganizers {
  electionId: number;
  primaryOrganizer: string;
  coOrganizers: CoOrganizer[];
  createdAt: number;
  updatedAt: number;
}

interface CoOrganizersPanelProps {
  electionId: number;
  primaryOrganizer: string;
}

export const CoOrganizersPanel: React.FC<CoOrganizersPanelProps> = ({
  electionId,
  primaryOrganizer
}) => {
  const { address } = useGetAccount();
  const { t } = useTranslation();
  const [organizers, setOrganizers] = useState<ElectionOrganizers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoOrganizerAddress, setNewCoOrganizerAddress] = useState('');
  const [permissions, setPermissions] = useState({
    canSetupEncryption: true,
    canDecryptVotes: true,
    canAddCoOrganizers: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [coOrganizerToRemove, setCoOrganizerToRemove] = useState<CoOrganizer | null>(null);

  // Vérifier si l'utilisateur connecté est l'organisateur principal
  const isPrimaryOrganizer = address.toLowerCase() === primaryOrganizer.toLowerCase();

  // Vérifier si l'utilisateur peut ajouter des co-organisateurs
  const canManageCoOrganizers = isPrimaryOrganizer ||
    organizers?.coOrganizers.find(
      co => co.address.toLowerCase() === address.toLowerCase() && co.permissions.canAddCoOrganizers
    );

  // Charger les organisateurs
  useEffect(() => {
    loadOrganizers();
  }, [electionId]);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/elections/${electionId}/organizers`
      );

      // Backend returns { success: true, data: { electionId, primaryOrganizer, coOrganizers } }
      const organizersData = response.data.data || response.data;
      setOrganizers(organizersData);
      console.log('Organisateurs chargés', organizersData);
    } catch (err: any) {
      console.error('Erreur lors du chargement des organisateurs', err);
      setError(t('coOrganizers.errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/elections/${electionId}/co-organizers`,
        {
          coOrganizerAddress: newCoOrganizerAddress,
          requestedBy: address,
          permissions
        }
      );

      setSuccess(t('coOrganizers.success.added'));
      setNewCoOrganizerAddress('');
      setShowAddForm(false);
      setPermissions({
        canSetupEncryption: true,
        canDecryptVotes: true,
        canAddCoOrganizers: false
      });

      // Recharger la liste
      await loadOrganizers();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du co-organisateur', err);
      setError(err.response?.data?.error || t('coOrganizers.errors.addError'));
    }
  };

  const handleRemoveCoOrganizer = async (coOrganizer: CoOrganizer) => {
    setCoOrganizerToRemove(coOrganizer);
    setShowRemoveModal(true);
  };

  const confirmRemoveCoOrganizer = async () => {
    if (!coOrganizerToRemove || !address) {
      setError(t('coOrganizers.errors.mustBeConnected'));
      setShowRemoveModal(false);
      return;
    }

    setError(null);
    setSuccess(null);
    setShowRemoveModal(false);

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/elections/${electionId}/co-organizers`,
        {
          data: {
            coOrganizerAddress: coOrganizerToRemove.address,
            requestedBy: address
          }
        }
      );

      setSuccess(t('coOrganizers.success.removed'));
      setCoOrganizerToRemove(null);
      await loadOrganizers();
    } catch (err: any) {
      console.error('Erreur lors du retrait du co-organisateur', err);
      setError(err.response?.data?.error || t('coOrganizers.errors.removeError'));
    }
  };

  const cancelRemoveCoOrganizer = () => {
    setShowRemoveModal(false);
    setCoOrganizerToRemove(null);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('coOrganizers.title')}</h3>
        <p className="text-gray-600 dark:text-gray-400">{t('coOrganizers.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <span>👥</span>
          {t('coOrganizers.title')}
        </h3>
        {canManageCoOrganizers && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md font-semibold"
          >
            {showAddForm ? `✕ ${t('coOrganizers.cancelButton')}` : `➕ ${t('coOrganizers.addButton')}`}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && canManageCoOrganizers && (
        <form onSubmit={handleAddCoOrganizer} className="mb-6 p-5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 rounded-xl shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t('coOrganizers.form.addressLabel')}
            </label>
            <input
              type="text"
              value={newCoOrganizerAddress}
              onChange={(e) => setNewCoOrganizerAddress(e.target.value)}
              placeholder={t('coOrganizers.form.addressPlaceholder')}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t('coOrganizers.form.permissionsLabel')}</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.canSetupEncryption}
                  onChange={(e) => setPermissions({ ...permissions, canSetupEncryption: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">
                  {t('coOrganizers.form.canSetupEncryption')}
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.canDecryptVotes}
                  onChange={(e) => setPermissions({ ...permissions, canDecryptVotes: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">
                  {t('coOrganizers.form.canDecryptVotes')}
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.canAddCoOrganizers}
                  onChange={(e) => setPermissions({ ...permissions, canAddCoOrganizers: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">
                  {t('coOrganizers.form.canAddCoOrganizers')}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md"
          >
            ✓ {t('coOrganizers.form.submitButton')}
          </button>
        </form>
      )}

      {/* Liste des organisateurs */}
      <div className="space-y-4">
        {/* Organisateur principal */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">👑</span>
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full shadow-sm">
                  ⭐ {t('coOrganizers.primaryOrganizer')}
                </span>
              </div>
              <p className="text-xs font-mono font-semibold ml-10 text-white bg-gray-800 dark:bg-gray-900 px-3 py-1.5 rounded inline-block">
                {formatAddress(organizers?.primaryOrganizer || primaryOrganizer)}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold ml-10 mt-2">
                ✓ {t('coOrganizers.allRights')}
              </p>
            </div>
          </div>
        </div>

        {/* Co-organisateurs */}
        {organizers?.coOrganizers && organizers.coOrganizers.length > 0 && organizers.coOrganizers.map((coOrg) => (
          <div
            key={coOrg.address}
            className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🔑</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-slate-600 to-gray-600 text-white text-xs font-semibold rounded-full shadow-sm">
                    {t('coOrganizers.coOrganizer')}
                  </span>
                </div>
                <p className="text-xs font-mono font-semibold ml-8 text-white bg-gray-800 dark:bg-gray-900 px-3 py-1.5 rounded inline-block mb-3">
                  {formatAddress(coOrg.address)}
                </p>

                <div className="flex flex-wrap gap-2 mb-3 ml-8">
                  {coOrg.permissions.canSetupEncryption && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-800 dark:to-cyan-800 text-teal-800 dark:text-teal-100 text-xs font-semibold rounded-lg border border-teal-300 dark:border-teal-600">
                      🔐 {t('coOrganizers.permissions.setupEncryption')}
                    </span>
                  )}
                  {coOrg.permissions.canDecryptVotes && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 text-purple-800 dark:text-purple-100 text-xs font-semibold rounded-lg border border-purple-300 dark:border-purple-600">
                      🔓 {t('coOrganizers.permissions.decryptVotes')}
                    </span>
                  )}
                  {coOrg.permissions.canAddCoOrganizers && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-800 dark:to-red-800 text-orange-800 dark:text-orange-100 text-xs font-semibold rounded-lg border border-orange-300 dark:border-orange-600">
                      👥 {t('coOrganizers.permissions.manageCoOrganizers')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('coOrganizers.addedBy', { date: formatDate(coOrg.addedAt), address: formatAddress(coOrg.addedBy) })}
                </p>
              </div>

              {canManageCoOrganizers && (
                <button
                  onClick={() => handleRemoveCoOrganizer(coOrg)}
                  className="ml-4 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-md"
                >
                  🗑️ {t('coOrganizers.removeButton')}
                </button>
              )}
            </div>
          </div>
        ))}

        {(!organizers?.coOrganizers || organizers.coOrganizers.length === 0) && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-6">
            <p className="font-semibold mb-1">{t('coOrganizers.empty.title')}</p>
            <p className="text-sm">{t('coOrganizers.empty.message')}</p>
          </div>
        )}
      </div>

      {/* Modal de confirmation de retrait */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onConfirm={confirmRemoveCoOrganizer}
        onCancel={cancelRemoveCoOrganizer}
        title={t('coOrganizers.modal.title')}
        message={t('coOrganizers.modal.message', {
          address: coOrganizerToRemove ? formatAddress(coOrganizerToRemove.address) : ''
        })}
        confirmText={t('coOrganizers.modal.confirmButton')}
        cancelText={t('coOrganizers.modal.cancelButton')}
        type="danger"
        confirmButtonClass="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
      />
    </div>
  );
};
