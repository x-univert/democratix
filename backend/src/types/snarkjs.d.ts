/**
 * Type definitions for snarkjs module
 * Since @types/snarkjs doesn't exist, we declare basic types here
 */

declare module 'snarkjs' {
  export namespace groth16 {
    export function verify(
      vKey: any,
      publicSignals: any,
      proof: any
    ): Promise<boolean>;

    export function fullProve(
      inputs: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{ proof: any; publicSignals: any }>;

    export function exportSolidityCallData(
      proof: any,
      publicSignals: any
    ): Promise<string>;
  }

  export namespace plonk {
    export function verify(
      vKey: any,
      publicSignals: any,
      proof: any
    ): Promise<boolean>;

    export function fullProve(
      inputs: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{ proof: any; publicSignals: any }>;
  }

  export namespace powersOfTau {
    export function newAccumulator(
      curve: any,
      power: number,
      fileName: string,
      logger?: any
    ): Promise<void>;

    export function contribute(
      oldPtauFileName: string,
      newPTauFileName: string,
      name: string,
      entropy: string,
      logger?: any
    ): Promise<void>;

    export function preparePhase2(
      oldPtauFileName: string,
      newPTauFileName: string,
      logger?: any
    ): Promise<void>;

    export function truncate(
      oldPtauFileName: string,
      newPTauFileName: string,
      power: number,
      logger?: any
    ): Promise<void>;

    export function convert(
      oldPtauFileName: string,
      newPTauFileName: string,
      name: string,
      logger?: any
    ): Promise<void>;

    export function verify(
      ptauFileName: string,
      logger?: any
    ): Promise<boolean>;

    export function beacon(
      oldPtauFileName: string,
      newPTauFileName: string,
      name: string,
      beaconHash: string,
      numIterationsExp: number,
      logger?: any
    ): Promise<void>;
  }

  export namespace zKey {
    export function newZKey(
      r1csName: string,
      ptauName: string,
      zkeyName: string,
      logger?: any
    ): Promise<void>;

    export function contribute(
      oldZkeyName: string,
      newZKeyName: string,
      name: string,
      entropy: string,
      logger?: any
    ): Promise<void>;

    export function beacon(
      oldZkeyName: string,
      newZKeyName: string,
      name: string,
      beaconHash: string,
      numIterationsExp: number,
      logger?: any
    ): Promise<void>;

    export function verify(
      r1csName: string,
      ptauName: string,
      zkeyName: string,
      logger?: any
    ): Promise<boolean>;

    export function exportVerificationKey(
      zkeyName: string
    ): Promise<any>;

    export function exportJson(
      zkeyFileName: string
    ): Promise<any>;

    export function bellmanContribute(
      curve: any,
      challengeFilename: string,
      responesFileName: string,
      entropy: string,
      logger?: any
    ): Promise<void>;
  }

  export namespace r1cs {
    export function info(
      r1csName: string,
      logger?: any
    ): Promise<any>;

    export function print(
      r1csName: string,
      symName: string,
      logger?: any
    ): Promise<void>;

    export function exportJson(
      r1csName: string
    ): Promise<any>;
  }

  export namespace wtns {
    export function calculate(
      inputs: any,
      wasmFileName: string,
      wtnsFileName: string
    ): Promise<void>;

    export function debug(
      inputs: any,
      wasmFileName: string,
      wtnsFileName: string,
      symName: string,
      options: any,
      logger?: any
    ): Promise<void>;

    export function exportJson(
      wtnsFileName: string
    ): Promise<any>;
  }
}
