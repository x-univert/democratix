import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { pollService } from '../services/pollService';
import { ipfsService } from '../services/ipfsService';

export class PollController {
  /**
   * Récupérer un sondage par ID
   */
  getPoll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pollId } = req.params;

      logger.info('Fetching poll', { pollId });

      const poll = await pollService.getPoll(parseInt(pollId));

      if (!poll) {
        res.status(404).json({
          success: false,
          error: 'Poll not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: poll,
      });
    } catch (error: any) {
      logger.error('Error fetching poll', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer tous les sondages
   */
  getAllPolls = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all polls');

      const polls = await pollService.getAllPolls();

      res.status(200).json({
        success: true,
        data: polls,
      });
    } catch (error: any) {
      logger.error('Error fetching all polls', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les sondages actifs
   */
  getActivePolls = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching active polls');

      const polls = await pollService.getActivePolls();

      res.status(200).json({
        success: true,
        data: polls,
      });
    } catch (error: any) {
      logger.error('Error fetching active polls', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les questions d'un sondage
   */
  getPollQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pollId } = req.params;

      logger.info('Fetching poll questions', { pollId });

      const questions = await pollService.getPollQuestions(parseInt(pollId));

      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      logger.error('Error fetching poll questions', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les options d'une question
   */
  getQuestionOptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { questionId } = req.params;

      logger.info('Fetching question options', { questionId });

      const options = await pollService.getQuestionOptions(parseInt(questionId));

      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (error: any) {
      logger.error('Error fetching question options', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les résultats d'un sondage
   */
  getPollResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pollId } = req.params;

      logger.info('Fetching poll results', { pollId });

      const results = await pollService.getPollResults(parseInt(pollId));

      if (!results) {
        res.status(404).json({
          success: false,
          error: 'Poll results not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Error fetching poll results', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Vérifier si un utilisateur a répondu à un sondage
   */
  hasUserResponded = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pollId } = req.params;
      const { userAddress } = req.query;

      if (!userAddress || typeof userAddress !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }

      logger.info('Checking if user responded to poll', { pollId, userAddress });

      const hasResponded = await pollService.hasUserResponded(parseInt(pollId), userAddress);

      res.status(200).json({
        success: true,
        data: { hasResponded },
      });
    } catch (error: any) {
      logger.error('Error checking if user responded', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer le nombre de sondages
   */
  getPollsCount = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching polls count');

      const count = await pollService.getPollsCount();

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Error fetching polls count', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Uploader les métadonnées d'un sondage sur IPFS
   */
  uploadPollMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = req.body;

      logger.info('Uploading poll metadata to IPFS');

      const ipfsHash = await ipfsService.uploadJSON(metadata, 'poll');

      res.status(200).json({
        success: true,
        data: { ipfsHash },
      });
    } catch (error: any) {
      logger.error('Error uploading poll metadata', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export const pollController = new PollController();
