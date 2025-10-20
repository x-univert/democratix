import { Router } from 'express';
import { voteController } from '../controllers/voteController';
import { validate, CastVoteSchema } from '../validators/schemas';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/votes/prepare
 * Préparer une transaction de vote
 */
router.post(
  '/prepare',
  validate(CastVoteSchema.extend({
    senderAddress: z.string().min(62).max(62),
  })),
  voteController.prepareCastVote
);

/**
 * POST /api/votes/encrypt
 * Générer un vote chiffré (MOCK pour POC - doit être fait côté client en prod)
 */
router.post(
  '/encrypt',
  validate(z.object({
    electionId: z.number().int().positive(),
    candidateId: z.number().int().positive(),
  })),
  voteController.encryptVote
);

export default router;
