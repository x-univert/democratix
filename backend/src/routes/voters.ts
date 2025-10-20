import { Router } from 'express';
import { voterController } from '../controllers/voterController';
import { validate, RegisterVoterSchema } from '../validators/schemas';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/voters/register/prepare
 * Préparer une transaction d'enregistrement d'électeur
 */
router.post(
  '/register/prepare',
  validate(RegisterVoterSchema.extend({
    senderAddress: z.string().min(62).max(62),
  })),
  voterController.prepareRegisterVoter
);

/**
 * POST /api/voters/check-token
 * Vérifier si un token de vote est valide
 */
router.post(
  '/check-token',
  validate(z.object({
    electionId: z.number().int().positive(),
    token: z.string().min(64),
  })),
  voterController.checkTokenValidity
);

export default router;
