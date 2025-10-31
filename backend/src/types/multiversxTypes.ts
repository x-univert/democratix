/**
 * MultiversX SDK v15 - StructType Definitions
 *
 * Ce fichier définit les types de structures utilisés pour interagir avec les smart contracts MultiversX.
 * Ces types sont réutilisables et permettent de créer des objets Struct typés correctement.
 *
 * Migration v13 → v15:
 * - Ancien: new Struct('Candidate', [fields])
 * - Nouveau: new Struct(CandidateType, [fields])
 */

import { StructType, FieldDefinition, U64Type, BytesType, AddressType, U8Type } from '@multiversx/sdk-core';

/**
 * Type de structure pour un candidat
 * Utilisé dans les élections pour représenter un candidat avec son ID, nom et description IPFS
 */
export const CandidateType = new StructType('Candidate', [
  new FieldDefinition('id', '', new U64Type()),
  new FieldDefinition('name', '', new BytesType()),
  new FieldDefinition('description_ipfs', '', new BytesType()),
]);

/**
 * Type de structure pour un vote
 * Représente un vote avec l'adresse de l'électeur, l'ID du candidat et le timestamp
 */
export const VoteType = new StructType('Vote', [
  new FieldDefinition('voter', '', new AddressType()),
  new FieldDefinition('candidate_id', '', new U64Type()),
  new FieldDefinition('timestamp', '', new U64Type()),
]);

/**
 * Type de structure pour une élection
 * Structure complète d'une élection avec tous ses attributs
 */
export const ElectionType = new StructType('Election', [
  new FieldDefinition('id', '', new U64Type()),
  new FieldDefinition('title', '', new BytesType()),
  new FieldDefinition('description_ipfs', '', new BytesType()),
  new FieldDefinition('organizer', '', new AddressType()),
  new FieldDefinition('start_time', '', new U64Type()),
  new FieldDefinition('end_time', '', new U64Type()),
  new FieldDefinition('status', '', new U8Type()),
  new FieldDefinition('total_votes', '', new U64Type()),
]);

/**
 * Type de structure pour un vote privé zk-SNARK
 * Utilisé pour les votes anonymes avec preuves zero-knowledge
 */
export const PrivateVoteType = new StructType('PrivateVote', [
  new FieldDefinition('vote_commitment', '', new BytesType()),
  new FieldDefinition('nullifier', '', new BytesType()),
  new FieldDefinition('backend_signature', '', new BytesType()),
  new FieldDefinition('timestamp', '', new U64Type()),
]);

/**
 * Type de structure pour un vote chiffré
 * Représente un vote chiffré avec sa preuve et son timestamp
 */
export const EncryptedVoteType = new StructType('EncryptedVote', [
  new FieldDefinition('encrypted_choice', '', new BytesType()),
  new FieldDefinition('proof', '', new BytesType()),
  new FieldDefinition('timestamp', '', new U64Type()),
]);

/**
 * Exemple d'utilisation:
 *
 * ```typescript
 * import { Struct, Field, U64Value, BytesValue } from '@multiversx/sdk-core';
 * import { CandidateType } from './types/multiversxTypes';
 *
 * const candidateStruct = new Struct(CandidateType, [
 *   new Field(new U64Value(1), 'id'),
 *   new Field(BytesValue.fromUTF8('Alice'), 'name'),
 *   new Field(BytesValue.fromUTF8('ipfs://...'), 'description_ipfs'),
 * ]);
 * ```
 */
