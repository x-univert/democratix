/**
 * Type declarations for circomlibjs
 * (Package doesn't have official types)
 */

declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function newMemEmptyTrie(): Promise<any>;
  export function buildMimcSponge(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildEddsa(): Promise<any>;
}
