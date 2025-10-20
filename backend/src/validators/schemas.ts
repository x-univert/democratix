import { z } from 'zod';

/**
 * Schéma de validation pour un candidat
 */
export const CandidateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).max(100),
  description_ipfs: z.string().optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * Schéma de validation pour la création d'une élection
 */
export const CreateElectionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(10000),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  candidates: z.array(CandidateSchema).min(2).max(50),
}).refine(data => data.endTime > data.startTime, {
  message: "La date de fin doit être après la date de début",
  path: ["endTime"],
}).refine(data => data.startTime > Math.floor(Date.now() / 1000), {
  message: "La date de début doit être dans le futur",
  path: ["startTime"],
});

export type CreateElectionInput = z.infer<typeof CreateElectionSchema>;

/**
 * Schéma pour l'enregistrement d'un électeur
 */
export const RegisterVoterSchema = z.object({
  electionId: z.number().int().positive(),
  credentialProof: z.string().min(64), // Hash minimum 32 bytes = 64 hex chars
});

export type RegisterVoterInput = z.infer<typeof RegisterVoterSchema>;

/**
 * Schéma pour un vote chiffré
 */
export const CastVoteSchema = z.object({
  electionId: z.number().int().positive(),
  votingToken: z.string().min(64),
  encryptedVote: z.string().min(1),
  proof: z.string().min(64), // zk-SNARK proof
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;

/**
 * Schéma pour activer/fermer une élection
 */
export const ElectionActionSchema = z.object({
  electionId: z.number().int().positive(),
});

export type ElectionActionInput = z.infer<typeof ElectionActionSchema>;

/**
 * Middleware de validation Zod
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Middleware de validation pour les paramètres d'URL
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Schéma pour les paramètres d'ID
 */
export const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});
