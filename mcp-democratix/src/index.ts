#!/usr/bin/env node

/**
 * MCP DEMOCRATIX Server
 *
 * Serveur MCP personnalisé pour automatiser les tâches DEMOCRATIX:
 * - Création d'élections de test
 * - Analytics blockchain
 * - Monitoring temps réel
 * - Génération clés ElGamal
 * - Upload IPFS
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Import tools
import { createTestElectionTool } from './tools/createTestElection.js';
import { getElectionStatsTool } from './tools/getElectionStats.js';
import { monitorVotesTool } from './tools/monitorVotes.js';
import { generateElGamalKeysTool } from './tools/generateElGamalKeys.js';
import { uploadToIPFSTool } from './tools/uploadToIPFS.js';
import { getVotesByTypeTool } from './tools/getVotesByType.js';

// Load environment variables
dotenv.config();

// Initialize server
const server = new Server(
  {
    name: 'democratix-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Available tools
const tools: Tool[] = [
  {
    name: 'create_test_election',
    description: 'Crée automatiquement une élection de test avec candidats, dates, et options configurables. Génère clés ElGamal si Option 1 ou 2.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Titre de l\'élection (ex: "Test Option 2 - zkSNARK")'
        },
        numCandidates: {
          type: 'number',
          description: 'Nombre de candidats (2-5)',
          minimum: 2,
          maximum: 5
        },
        encryptionType: {
          type: 'number',
          description: '0=Standard, 1=ElGamal, 2=ElGamal+zkSNARK',
          enum: [0, 1, 2]
        },
        durationHours: {
          type: 'number',
          description: 'Durée de l\'élection en heures (défaut: 1)',
          default: 1
        },
        requiresRegistration: {
          type: 'boolean',
          description: 'Inscription requise ? (défaut: false)',
          default: false
        }
      },
      required: ['title', 'numCandidates', 'encryptionType']
    }
  },
  {
    name: 'get_election_stats',
    description: 'Récupère les statistiques d\'une élection depuis la blockchain MultiversX: total votes, votes par type, statut, dates, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        electionId: {
          type: 'number',
          description: 'ID de l\'élection à analyser'
        }
      },
      required: ['electionId']
    }
  },
  {
    name: 'monitor_votes',
    description: 'Monitore les votes en temps réel pour une élection. Retourne les derniers votes avec type (standard/chiffré/zkSNARK), timestamp, et gas utilisé.',
    inputSchema: {
      type: 'object',
      properties: {
        electionId: {
          type: 'number',
          description: 'ID de l\'élection à monitorer'
        },
        limit: {
          type: 'number',
          description: 'Nombre de votes à récupérer (défaut: 10)',
          default: 10
        }
      },
      required: ['electionId']
    }
  },
  {
    name: 'generate_elgamal_keys',
    description: 'Génère une paire de clés ElGamal (publique/privée) pour chiffrement de votes Options 1 et 2. Retourne les clés en format hex.',
    inputSchema: {
      type: 'object',
      properties: {
        saveToFile: {
          type: 'boolean',
          description: 'Sauvegarder dans .secure-keys/ ? (défaut: false)',
          default: false
        }
      }
    }
  },
  {
    name: 'upload_to_ipfs',
    description: 'Upload des métadonnées (élection ou candidat) sur IPFS via Pinata. Retourne le hash IPFS et l\'URL.',
    inputSchema: {
      type: 'object',
      properties: {
        metadata: {
          type: 'object',
          description: 'Objet JSON avec métadonnées (title, description, candidates, etc.)'
        },
        name: {
          type: 'string',
          description: 'Nom du fichier IPFS (ex: "election-90-metadata")'
        }
      },
      required: ['metadata', 'name']
    }
  },
  {
    name: 'get_votes_by_type',
    description: 'Récupère le nombre de votes par type de chiffrement pour toutes les élections ou une élection spécifique',
    inputSchema: {
      type: 'object',
      properties: {
        electionId: {
          type: 'number',
          description: 'ID de l\'élection (optionnel - si non fourni, analyse toutes les élections)'
        }
      }
    }
  }
];

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_test_election':
        return await createTestElectionTool(args);

      case 'get_election_stats':
        return await getElectionStatsTool(args);

      case 'monitor_votes':
        return await monitorVotesTool(args);

      case 'generate_elgamal_keys':
        return await generateElGamalKeysTool(args);

      case 'upload_to_ipfs':
        return await uploadToIPFSTool(args);

      case 'get_votes_by_type':
        return await getVotesByTypeTool(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error executing ${name}: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('🗳️  DEMOCRATIX MCP Server started');
  console.error('📡 Available tools:', tools.map(t => t.name).join(', '));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
