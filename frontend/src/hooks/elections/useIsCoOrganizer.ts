import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetAccount } from 'lib';

export const useIsCoOrganizer = (electionId: number, primaryOrganizer: string) => {
  const { address } = useGetAccount();
  const [isCoOrganizer, setIsCoOrganizer] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOrganizerStatus = async () => {
      if (!address || !electionId) {
        setIsOrganizer(false);
        setIsCoOrganizer(false);
        setLoading(false);
        return;
      }

      // Vérifier si c'est l'organisateur principal
      const isPrimary = address.toLowerCase() === primaryOrganizer.toLowerCase();
      setIsOrganizer(isPrimary);

      if (isPrimary) {
        setIsCoOrganizer(false);
        setLoading(false);
        return;
      }

      // Vérifier si c'est un co-organisateur
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/api/elections/${electionId}/organizers`
        );

        // Backend returns { success: true, data: { electionId, primaryOrganizer, coOrganizers } }
        const organizersData = response.data.data || response.data;
        const coOrganizers = organizersData?.coOrganizers || [];
        const isCoOrg = coOrganizers.some(
          (co: any) => co.address.toLowerCase() === address.toLowerCase()
        );

        setIsCoOrganizer(isCoOrg);
        setIsOrganizer(isCoOrg); // Un co-organisateur est aussi considéré comme organisateur
      } catch (error) {
        console.error('Error checking co-organizer status:', error);
        setIsCoOrganizer(false);
      } finally {
        setLoading(false);
      }
    };

    checkOrganizerStatus();
  }, [address, electionId, primaryOrganizer]);

  return {
    isOrganizer, // true si organisateur principal OU co-organisateur
    isPrimaryOrganizer: address?.toLowerCase() === primaryOrganizer.toLowerCase(),
    isCoOrganizer, // true uniquement si co-organisateur
    loading
  };
};
