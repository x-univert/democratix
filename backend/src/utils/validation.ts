/**
 * Validation utilities for ElGamal cryptography
 * Ensures data integrity and security
 */

import { logger } from './logger';

/**
 * Validates a hex string
 */
export function isValidHex(str: string, expectedLength?: number): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Check if it's valid hex
  if (!/^[0-9a-fA-F]+$/.test(str)) {
    return false;
  }

  // Check length if specified
  if (expectedLength !== undefined && str.length !== expectedLength) {
    return false;
  }

  return true;
}

/**
 * Validates an ElGamal public key
 * - Must be 66 hex characters (33 bytes compressed) or 130 hex characters (65 bytes uncompressed)
 */
export function isValidPublicKey(publicKey: string): { valid: boolean; error?: string } {
  if (!publicKey || typeof publicKey !== 'string') {
    return { valid: false, error: 'Public key must be a non-empty string' };
  }

  // Remove any whitespace
  const cleanKey = publicKey.trim().replace(/\s+/g, '');

  // Check if it's hex
  if (!isValidHex(cleanKey)) {
    return { valid: false, error: 'Public key must be a valid hexadecimal string' };
  }

  // Check length (33 bytes compressed or 65 bytes uncompressed)
  if (cleanKey.length !== 66 && cleanKey.length !== 130) {
    return {
      valid: false,
      error: `Invalid public key length: ${cleanKey.length}. Expected 66 (compressed) or 130 (uncompressed) hex characters`
    };
  }

  // Check prefix for compressed keys (02, 03)
  if (cleanKey.length === 66) {
    const prefix = cleanKey.substring(0, 2);
    if (prefix !== '02' && prefix !== '03') {
      return {
        valid: false,
        error: `Invalid compressed public key prefix: ${prefix}. Expected 02 or 03`
      };
    }
  }

  // Check prefix for uncompressed keys (04)
  if (cleanKey.length === 130) {
    const prefix = cleanKey.substring(0, 2);
    if (prefix !== '04') {
      return {
        valid: false,
        error: `Invalid uncompressed public key prefix: ${prefix}. Expected 04`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an ElGamal private key
 * - Must be 64 hex characters (32 bytes)
 * - Must be in valid range for secp256k1 (0 < key < n)
 */
export function isValidPrivateKey(privateKey: string): { valid: boolean; error?: string } {
  if (!privateKey || typeof privateKey !== 'string') {
    return { valid: false, error: 'Private key must be a non-empty string' };
  }

  // Remove any whitespace
  const cleanKey = privateKey.trim().replace(/\s+/g, '');

  // Check if it's hex
  if (!isValidHex(cleanKey)) {
    return { valid: false, error: 'Private key must be a valid hexadecimal string' };
  }

  // Check length (32 bytes = 64 hex chars)
  if (cleanKey.length !== 64) {
    return {
      valid: false,
      error: `Invalid private key length: ${cleanKey.length}. Expected 64 hex characters (32 bytes)`
    };
  }

  // Check if key is in valid range for secp256k1 (0 < key < n)
  // n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
  const keyValue = BigInt('0x' + cleanKey);
  const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  if (keyValue <= 0n || keyValue >= CURVE_ORDER) {
    return {
      valid: false,
      error: 'Private key must be in range (0 < key < curve_order)'
    };
  }

  return { valid: true };
}

/**
 * Validates an ElGamal ciphertext component (c1 or c2)
 * - Must be a valid secp256k1 point (33 bytes compressed or 65 bytes uncompressed)
 */
export function isValidCiphertext(ciphertext: string): { valid: boolean; error?: string } {
  // Same validation as public key (both are curve points)
  return isValidPublicKey(ciphertext);
}

/**
 * Validates a candidate ID
 */
export function isValidCandidateId(candidateId: number, maxCandidates: number): { valid: boolean; error?: string } {
  if (typeof candidateId !== 'number' || !Number.isInteger(candidateId)) {
    return { valid: false, error: 'Candidate ID must be an integer' };
  }

  if (candidateId < 0) {
    return { valid: false, error: 'Candidate ID must be non-negative' };
  }

  if (candidateId >= maxCandidates) {
    return {
      valid: false,
      error: `Candidate ID ${candidateId} out of range. Maximum: ${maxCandidates - 1}`
    };
  }

  return { valid: true };
}

/**
 * Validates an election ID
 */
export function isValidElectionId(electionId: number): { valid: boolean; error?: string } {
  if (typeof electionId !== 'number' || !Number.isInteger(electionId)) {
    return { valid: false, error: 'Election ID must be an integer' };
  }

  if (electionId <= 0) {
    return { valid: false, error: 'Election ID must be positive' };
  }

  return { valid: true };
}

/**
 * Validates a MultiversX address
 */
export function isValidAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address must be a non-empty string' };
  }

  const cleanAddress = address.trim();

  // Check format: erd1 + 58 characters
  if (!/^erd1[a-z0-9]{58}$/.test(cleanAddress)) {
    return {
      valid: false,
      error: 'Invalid MultiversX address format. Must be erd1 followed by 58 alphanumeric characters'
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(str: string, maxLength: number = 1000): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  // Remove control characters and limit length
  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength)
    .trim();
}

/**
 * Validates and sanitizes user input
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates ElGamal encryption setup request
 */
export function validateSetupEncryptionRequest(body: any): ValidationResult<{
  electionId: number;
  organizerAddress: string;
}> {
  const { electionId, organizerAddress } = body;

  // Validate election ID
  const electionIdValidation = isValidElectionId(electionId);
  if (!electionIdValidation.valid) {
    return { valid: false, error: electionIdValidation.error };
  }

  // Validate organizer address
  const addressValidation = isValidAddress(organizerAddress);
  if (!addressValidation.valid) {
    return { valid: false, error: addressValidation.error };
  }

  return {
    valid: true,
    data: { electionId, organizerAddress }
  };
}

/**
 * Validates decrypt votes request
 */
export function validateDecryptVotesRequest(body: any): ValidationResult<{
  privateKey: string;
  organizerAddress?: string;
}> {
  const { privateKey, organizerAddress } = body;

  // Validate private key
  const keyValidation = isValidPrivateKey(privateKey);
  if (!keyValidation.valid) {
    return { valid: false, error: keyValidation.error };
  }

  // Optionally validate organizer address
  if (organizerAddress) {
    const addressValidation = isValidAddress(organizerAddress);
    if (!addressValidation.valid) {
      return { valid: false, error: addressValidation.error };
    }
  }

  return {
    valid: true,
    data: { privateKey, organizerAddress }
  };
}

/**
 * Validates encrypted vote data
 */
export function validateEncryptedVote(vote: any): ValidationResult<{
  c1: string;
  c2: string;
}> {
  const { c1, c2 } = vote;

  if (!c1 || !c2) {
    return { valid: false, error: 'Missing c1 or c2 in encrypted vote' };
  }

  // Validate c1
  const c1Validation = isValidCiphertext(c1);
  if (!c1Validation.valid) {
    return { valid: false, error: `Invalid c1: ${c1Validation.error}` };
  }

  // Validate c2
  const c2Validation = isValidCiphertext(c2);
  if (!c2Validation.valid) {
    return { valid: false, error: `Invalid c2: ${c2Validation.error}` };
  }

  return {
    valid: true,
    data: { c1, c2 }
  };
}

/**
 * Error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error class for cryptographic errors
 */
export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/**
 * Error class for authorization errors
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Throws a validation error if condition is false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    logger.error('Validation assertion failed', { message });
    throw new ValidationError(message);
  }
}
