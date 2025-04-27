import { Router } from 'express';
import { PgStorage } from '../pg-storage.js';
import { type AICapability, insertAICapabilitySchema } from '@shared/schema';

const router = Router();
const storage = new PgStorage();

// GET /api/capabilities - Get all capabilities
router.get('/', async (req, res) => {
  try {
    const capabilities = await storage.listAICapabilities();

    // Transform the data to match the frontend schema
    const transformedCapabilities = capabilities.map((cap: any) => ({
      id: cap.id,
      name: cap.name,
      description: cap.description || '',
      category: cap.category || 'Uncategorized',
      implementationEffort: cap.implementation_effort || 'Medium',
      businessValue: cap.business_value || 'Medium',
      easeScore: cap.ease_score || null,
      valueScore: cap.value_score || null
    }));

    res.json(transformedCapabilities);
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
});

// POST /api/capabilities - Create a new capability
router.post('/', async (req, res) => {
  try {
    // Validate request body against schema
    const validatedData = insertAICapabilitySchema.parse(req.body);

    // Create the capability
    const capability = await storage.createAICapability({
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      implementation_effort: validatedData.implementation_effort,
      business_value: validatedData.business_value
    });

    // Transform the response to match frontend schema
    const transformedCapability = {
      id: capability.id,
      name: capability.name,
      description: capability.description || '',
      category: capability.category || 'Uncategorized',
      implementationEffort: capability.implementation_effort || 'Medium',
      businessValue: capability.business_value || 'Medium',
      easeScore: capability.ease_score || null,
      valueScore: capability.value_score || null
    };

    res.status(201).json(transformedCapability);
  } catch (error) {
    console.error('Error creating capability:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create capability' });
    }
  }
});

export default router; 