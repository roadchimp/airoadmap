import { Router } from 'express';
import { PgStorage } from '../pg-storage.js';
import { type AICapability } from '@shared/schema';

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

export default router; 