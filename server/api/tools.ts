import { Router } from 'express';
import { storage } from '../storage';
import { type AiTool, insertAiToolSchema } from '@shared/schema';

const router = Router();

/**
 * @route GET /api/tools
 * @description Lists AI tools, optionally filtering by search, category, and license type.
 * @query {string} [search] - Optional search term.
 * @query {string} [category] - Optional primary category filter.
 * @query {string} [licenseType] - Optional license type filter.
 * @returns {AiTool[]} Array of AI tools.
 */
router.get('/', async (req, res) => {
  const { search, category, licenseType } = req.query;
  try {
    // Pass query parameters as strings to storage method
    const tools: AiTool[] = await storage.listAITools(
      search as string | undefined,
      category as string | undefined,
      licenseType as string | undefined
    );
    res.json(tools); // Return AiTool[] (snake_case)
  } catch (error) {
    console.error("Error listing AI tools:", error);
    res.status(500).json({ message: 'Failed to retrieve AI tools' });
  }
});

/**
 * @route GET /api/tools/:id
 * @description Retrieves a specific AI tool by its ID.
 * @param {number} id - The ID of the AI tool.
 * @returns {AiTool} The AI tool object.
 * @throws {404} If the tool is not found.
 * @throws {400} If the ID is invalid.
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid AI tool ID' });
  }
  try {
    const tool: AiTool | undefined = await storage.getAITool(id);
    if (!tool) {
      return res.status(404).json({ message: 'AI tool not found' });
    }
    res.json(tool); // Return AiTool (snake_case)
  } catch (error) {
    console.error(`Error getting AI tool ${id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve AI tool' });
  }
});

/**
 * @route POST /api/tools
 * @description Creates a new AI tool.
 * @body {InsertAiTool} The AI tool data conforming to the insert schema (snake_case).
 * @returns {AiTool} The newly created AI tool object.
 * @throws {400} If validation fails.
 */
router.post('/', async (req, res) => {
  try {
    // Validate incoming data against the snake_case insert schema
    const validatedData = insertAiToolSchema.parse(req.body);
    
    // Data should already be in InsertAiTool format (snake_case)
    const newTool: AiTool = await storage.createAITool(validatedData);
    
    res.status(201).json(newTool); // Return created AiTool (snake_case)
  } catch (error: any) {
    console.error("Error creating AI tool:", error);
    if (error.errors) { // Handle Zod validation errors
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(400).json({ message: 'Failed to create AI tool', error: error.message });
  }
});

/**
 * @route PUT /api/tools/:id
 * @description Updates an existing AI tool.
 * @param {number} id - The ID of the AI tool to update.
 * @body {Partial<InsertAiTool>} A partial object containing the fields to update (snake_case).
 * @returns {AiTool} The updated AI tool object.
 * @throws {404} If the tool is not found.
 * @throws {400} If the ID is invalid or validation fails.
 */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid AI tool ID' });
  }
  try {
    // Validate incoming data against the snake_case insert schema, but allow partials
    // We use .partial() here because PUT might only update some fields
    const validatedData = insertAiToolSchema.partial().parse(req.body);

    // validatedData should be Partial<InsertAiTool> (snake_case)
    const updatedTool: AiTool = await storage.updateAITool(id, validatedData);
    
    res.json(updatedTool); // Return updated AiTool (snake_case)
  } catch (error: any) {
    console.error(`Error updating AI tool ${id}:`, error);
    if (error.errors) { // Handle Zod validation errors
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(400).json({ message: 'Failed to update AI tool', error: error.message });
  }
});

/**
 * @route DELETE /api/tools/:id
 * @description Deletes an AI tool by its ID.
 * @param {number} id - The ID of the AI tool to delete.
 * @returns {204} No content on successful deletion.
 * @throws {400} If the ID is invalid.
 */
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid AI tool ID' });
  }
  try {
    await storage.deleteAITool(id); // Expects Promise<void>
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    console.error(`Error deleting AI tool ${id}:`, error);
    res.status(500).json({ message: 'Failed to delete AI tool' });
  }
});

export default router; 