import { Router } from 'express';
import { PgStorage } from '../pg-storage.js';
import { type AITool, insertAIToolSchema } from '@shared/schema';

const router = Router();
const storage = new PgStorage();

// GET /api/tools - Get all AI tools
router.get('/', async (req, res) => {
  try {
    const tools = await storage.listAITools();

    // Transform the data to match the frontend schema
    const transformedTools = tools.map(tool => ({
      id: tool.id,
      tool_name: tool.tool_name,
      description: tool.description || '',
      website_url: tool.website_url || '',
      license_type: tool.license_type || 'Unknown',
      primary_category: tool.primary_category || 'Uncategorized',
      tags: tool.tags || [],
      created_at: tool.created_at,
      updated_at: tool.updated_at
    }));

    res.json(transformedTools);
  } catch (error) {
    console.error('Error fetching AI tools:', error);
    res.status(500).json({ error: 'Failed to fetch AI tools' });
  }
});

// POST /api/tools - Create a new AI tool
router.post('/', async (req, res) => {
  try {
    // Validate request body against schema
    const validatedData = insertAIToolSchema.parse(req.body);

    // Create the tool
    const tool = await storage.createAITool({
      tool_name: validatedData.tool_name,
      description: validatedData.description,
      website_url: validatedData.website_url,
      license_type: validatedData.license_type,
      primary_category: validatedData.primary_category,
      tags: validatedData.tags
    });

    res.status(201).json(tool);
  } catch (error) {
    console.error('Error creating AI tool:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create AI tool' });
    }
  }
});

export default router; 