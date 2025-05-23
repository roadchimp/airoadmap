import { Router } from 'express';
import { PgStorage } from '../pg-storage.js';
import { ZodError } from 'zod';
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
      default_implementation_effort: cap.default_implementation_effort || 'Medium',
      default_business_value: cap.default_business_value || 'Medium',
      default_ease_score: cap.default_ease_score || null,
      default_value_score: cap.default_value_score || null
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

    // Create the capability using underscore_case properties matching the schema
    const capability = await storage.createAICapability({
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      default_implementation_effort: validatedData.default_implementation_effort,
      default_business_value: validatedData.default_business_value,
      default_ease_score: validatedData.default_ease_score !== undefined && validatedData.default_ease_score !== null 
        ? String(validatedData.default_ease_score) 
        : null,
      default_value_score: validatedData.default_value_score !== undefined && validatedData.default_value_score !== null 
        ? String(validatedData.default_value_score) 
        : null,
      default_feasibility_score: validatedData.default_feasibility_score !== undefined && validatedData.default_feasibility_score !== null 
        ? String(validatedData.default_feasibility_score) 
        : null,
      default_impact_score: validatedData.default_impact_score !== undefined && validatedData.default_impact_score !== null 
        ? String(validatedData.default_impact_score) 
        : null,
      tags: validatedData.tags || [],
    });

    // Transform the response to match frontend schema, using underscore_case from capability object
    const transformedCapability = {
      id: capability.id,
      name: capability.name,
      description: capability.description || '',
      category: capability.category || 'Uncategorized',
      default_implementation_effort: capability.default_implementation_effort || 'Medium',
      default_business_value: capability.default_business_value || 'Medium',
      default_ease_score: capability.default_ease_score || null,
      default_value_score: capability.default_value_score || null
    };

    res.status(201).json(transformedCapability);
  } catch (error) {
    console.error('Error creating capability:', error);
    // Check if it's a Zod validation error
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else if (error instanceof Error) { // Handle generic errors
        res.status(500).json({ error: `Failed to create capability: ${error.message}` });
    } else { // Handle unknown errors
        res.status(500).json({ error: 'Failed to create capability due to an unknown error' });
    }
  }
});

export default router; 