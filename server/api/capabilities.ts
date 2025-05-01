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

    // Create the capability using camelCase properties matching the schema
    const capability = await storage.createAICapability({
      // Add missing validated fields from schema if needed (like id, tags etc if applicable for creation)
      id: validatedData.id, // Assuming id might be passed for specific creation scenarios
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      implementationEffort: validatedData.implementationEffort, // Use camelCase
      businessValue: validatedData.businessValue, // Use camelCase
      easeScore: validatedData.easeScore, // Add if in schema
      valueScore: validatedData.valueScore, // Add if in schema
      primary_category: validatedData.primary_category, // Add if in schema
      license_type: validatedData.license_type, // Add if in schema
      website_url: validatedData.website_url, // Add if in schema
      tags: validatedData.tags, // Add if in schema
    });

    // Transform the response to match frontend schema, using camelCase from capability object
    const transformedCapability = {
      id: capability.id,
      name: capability.name,
      description: capability.description || '',
      category: capability.category || 'Uncategorized',
      implementationEffort: capability.implementationEffort || 'Medium', // Use camelCase
      businessValue: capability.businessValue || 'Medium', // Use camelCase
      easeScore: capability.easeScore || null, // Use camelCase
      valueScore: capability.valueScore || null // Use camelCase
      // Add other relevant fields if needed by frontend
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