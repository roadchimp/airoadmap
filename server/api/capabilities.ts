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
      defaultImplementationEffort: cap.default_implementation_effort || 'Medium',
      defaultBusinessValue: cap.default_business_value || 'Medium',
      defaultEaseScore: cap.default_ease_score || null,
      defaultValueScore: cap.default_value_score || null
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

    // Create the capability using camelCase properties matching the schema
    const capability = await storage.createAICapability({
      // Add missing validated fields from schema if needed (like id, tags etc if applicable for creation)
      id: validatedData.id, // Assuming id might be passed for specific creation scenarios
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      defaultImplementationEffort: validatedData.defaultImplementationEffort,
      defaultBusinessValue: validatedData.defaultBusinessValue,
      defaultEaseScore: validatedData.defaultEaseScore !== undefined && validatedData.defaultEaseScore !== null 
        ? String(validatedData.defaultEaseScore) 
        : null,
      defaultValueScore: validatedData.defaultValueScore !== undefined && validatedData.defaultValueScore !== null 
        ? String(validatedData.defaultValueScore) 
        : null,
      defaultFeasibilityScore: validatedData.defaultFeasibilityScore !== undefined && validatedData.defaultFeasibilityScore !== null 
        ? String(validatedData.defaultFeasibilityScore) 
        : null,
      defaultImpactScore: validatedData.defaultImpactScore !== undefined && validatedData.defaultImpactScore !== null 
        ? String(validatedData.defaultImpactScore) 
        : null,
      tags: validatedData.tags || [],
    });

    // Transform the response to match frontend schema, using camelCase from capability object
    const transformedCapability = {
      id: capability.id,
      name: capability.name,
      description: capability.description || '',
      category: capability.category || 'Uncategorized',
      defaultImplementationEffort: capability.defaultImplementationEffort || 'Medium',
      defaultBusinessValue: capability.defaultBusinessValue || 'Medium',
      defaultEaseScore: capability.defaultEaseScore || null,
      defaultValueScore: capability.defaultValueScore || null
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