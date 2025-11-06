/**
 * CoOrganizersService - Gestion des co-organisateurs d'élections
 *
 * Permet à plusieurs personnes de gérer une élection (setup encryption, decrypt votes, etc.)
 * Complète le système on-chain qui n'a qu'un seul organisateur principal
 */

import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const CO_ORGANIZERS_DIR = path.join(process.cwd(), '.secure-keys');
const CO_ORGANIZERS_FILE = 'co-organizers.json';

export interface CoOrganizer {
  address: string;
  addedAt: number;
  addedBy: string; // Address who added this co-organizer
  permissions: {
    canSetupEncryption: boolean;
    canDecryptVotes: boolean;
    canAddCoOrganizers: boolean;
  };
}

export interface ElectionCoOrganizers {
  electionId: number;
  primaryOrganizer: string; // From smart contract
  coOrganizers: CoOrganizer[];
  createdAt: number;
  updatedAt: number;
}

export class CoOrganizersService {
  private coOrganizersCache: Map<number, ElectionCoOrganizers> = new Map();

  constructor() {
    this.loadCoOrganizers();
  }

  /**
   * Charge les co-organisateurs depuis le fichier
   */
  private async loadCoOrganizers(): Promise<void> {
    try {
      const filePath = path.join(CO_ORGANIZERS_DIR, CO_ORGANIZERS_FILE);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Charger dans le cache
      for (const item of parsed) {
        this.coOrganizersCache.set(item.electionId, item);
      }

      logger.info('✅ Co-organizers loaded', {
        electionsCount: this.coOrganizersCache.size
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.info('No co-organizers file found, starting fresh');
        await this.saveCoOrganizers();
      } else {
        logger.error('Failed to load co-organizers', { error });
      }
    }
  }

  /**
   * Sauvegarde les co-organisateurs dans le fichier
   */
  private async saveCoOrganizers(): Promise<void> {
    try {
      const data = Array.from(this.coOrganizersCache.values());
      const filePath = path.join(CO_ORGANIZERS_DIR, CO_ORGANIZERS_FILE);

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), {
        mode: 0o600
      });

      logger.debug('Co-organizers saved', {
        electionsCount: data.length
      });
    } catch (error) {
      logger.error('Failed to save co-organizers', { error });
      throw new Error('Failed to save co-organizers');
    }
  }

  /**
   * Initialise les co-organisateurs pour une élection
   */
  async initializeElection(
    electionId: number,
    primaryOrganizer: string
  ): Promise<void> {
    if (this.coOrganizersCache.has(electionId)) {
      logger.warn('Election already initialized', { electionId });
      return;
    }

    const coOrganizers: ElectionCoOrganizers = {
      electionId,
      primaryOrganizer: primaryOrganizer.toLowerCase(),
      coOrganizers: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.coOrganizersCache.set(electionId, coOrganizers);
    await this.saveCoOrganizers();

    logger.info('✅ Election co-organizers initialized', { electionId, primaryOrganizer });
  }

  /**
   * Ajoute un co-organisateur à une élection
   */
  async addCoOrganizer(
    electionId: number,
    coOrganizerAddress: string,
    addedBy: string,
    permissions: {
      canSetupEncryption?: boolean;
      canDecryptVotes?: boolean;
      canAddCoOrganizers?: boolean;
    } = {}
  ): Promise<void> {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      throw new Error(`Election ${electionId} not initialized for co-organizers`);
    }

    const normalizedAddress = coOrganizerAddress.toLowerCase();

    // Vérifier si déjà ajouté
    if (election.coOrganizers.some(co => co.address === normalizedAddress)) {
      throw new Error('Address is already a co-organizer');
    }

    // Vérifier si c'est l'organisateur principal
    if (election.primaryOrganizer === normalizedAddress) {
      throw new Error('Primary organizer cannot be added as co-organizer');
    }

    const coOrganizer: CoOrganizer = {
      address: normalizedAddress,
      addedAt: Date.now(),
      addedBy: addedBy.toLowerCase(),
      permissions: {
        canSetupEncryption: permissions.canSetupEncryption ?? true,
        canDecryptVotes: permissions.canDecryptVotes ?? true,
        canAddCoOrganizers: permissions.canAddCoOrganizers ?? false // Par défaut, seul le primary peut ajouter
      }
    };

    election.coOrganizers.push(coOrganizer);
    election.updatedAt = Date.now();

    await this.saveCoOrganizers();

    logger.info('✅ Co-organizer added', {
      electionId,
      coOrganizer: normalizedAddress,
      addedBy,
      permissions: coOrganizer.permissions
    });
  }

  /**
   * Retire un co-organisateur
   */
  async removeCoOrganizer(
    electionId: number,
    coOrganizerAddress: string,
    removedBy: string
  ): Promise<void> {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      throw new Error(`Election ${electionId} not initialized for co-organizers`);
    }

    const normalizedAddress = coOrganizerAddress.toLowerCase();
    const index = election.coOrganizers.findIndex(co => co.address === normalizedAddress);

    if (index === -1) {
      throw new Error('Address is not a co-organizer');
    }

    election.coOrganizers.splice(index, 1);
    election.updatedAt = Date.now();

    await this.saveCoOrganizers();

    logger.info('✅ Co-organizer removed', {
      electionId,
      coOrganizer: normalizedAddress,
      removedBy
    });
  }

  /**
   * Vérifie si une adresse est organisateur (principal ou co)
   */
  isOrganizer(electionId: number, address: string): boolean {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      return false;
    }

    const normalizedAddress = address.toLowerCase();

    // Vérifier si c'est l'organisateur principal
    if (election.primaryOrganizer === normalizedAddress) {
      return true;
    }

    // Vérifier si c'est un co-organisateur
    return election.coOrganizers.some(co => co.address === normalizedAddress);
  }

  /**
   * Vérifie si une adresse peut setup le chiffrement
   */
  canSetupEncryption(electionId: number, address: string): boolean {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      return false;
    }

    const normalizedAddress = address.toLowerCase();

    // Organisateur principal peut toujours
    if (election.primaryOrganizer === normalizedAddress) {
      return true;
    }

    // Vérifier permissions du co-organisateur
    const coOrg = election.coOrganizers.find(co => co.address === normalizedAddress);
    return coOrg?.permissions.canSetupEncryption ?? false;
  }

  /**
   * Vérifie si une adresse peut déchiffrer les votes
   */
  canDecryptVotes(electionId: number, address: string): boolean {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      return false;
    }

    const normalizedAddress = address.toLowerCase();

    // Organisateur principal peut toujours
    if (election.primaryOrganizer === normalizedAddress) {
      return true;
    }

    // Vérifier permissions du co-organisateur
    const coOrg = election.coOrganizers.find(co => co.address === normalizedAddress);
    return coOrg?.permissions.canDecryptVotes ?? false;
  }

  /**
   * Vérifie si une adresse peut ajouter des co-organisateurs
   */
  canAddCoOrganizers(electionId: number, address: string): boolean {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      return false;
    }

    const normalizedAddress = address.toLowerCase();

    // Organisateur principal peut toujours
    if (election.primaryOrganizer === normalizedAddress) {
      return true;
    }

    // Vérifier permissions du co-organisateur
    const coOrg = election.coOrganizers.find(co => co.address === normalizedAddress);
    return coOrg?.permissions.canAddCoOrganizers ?? false;
  }

  /**
   * Récupère la liste des co-organisateurs d'une élection
   */
  getCoOrganizers(electionId: number): CoOrganizer[] {
    const election = this.coOrganizersCache.get(electionId);
    return election?.coOrganizers ?? [];
  }

  /**
   * Récupère toutes les informations sur les organisateurs d'une élection
   */
  getElectionOrganizers(electionId: number): ElectionCoOrganizers | null {
    return this.coOrganizersCache.get(electionId) ?? null;
  }

  /**
   * Met à jour les permissions d'un co-organisateur
   */
  async updatePermissions(
    electionId: number,
    coOrganizerAddress: string,
    permissions: Partial<CoOrganizer['permissions']>
  ): Promise<void> {
    const election = this.coOrganizersCache.get(electionId);
    if (!election) {
      throw new Error(`Election ${electionId} not initialized for co-organizers`);
    }

    const normalizedAddress = coOrganizerAddress.toLowerCase();
    const coOrg = election.coOrganizers.find(co => co.address === normalizedAddress);

    if (!coOrg) {
      throw new Error('Address is not a co-organizer');
    }

    // Mettre à jour les permissions
    coOrg.permissions = {
      ...coOrg.permissions,
      ...permissions
    };

    election.updatedAt = Date.now();
    await this.saveCoOrganizers();

    logger.info('✅ Co-organizer permissions updated', {
      electionId,
      coOrganizer: normalizedAddress,
      newPermissions: coOrg.permissions
    });
  }
}

// Export singleton instance
export const coOrganizersService = new CoOrganizersService();
