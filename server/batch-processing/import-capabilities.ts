import { PgStorage } from '../pg-storage';
import { readFileSync } from 'fs';
import { aiCapabilitiesTable } from '@shared/schema';
import { eq, and, or, sql } from 'drizzle-orm';

async function importCapabilities() {
  const storage = new PgStorage();
  
  // Read the JSONL file
  const jsonlContent = readFileSync('server/batch-processing/responses/batch_2025-05-22T21-30-03-184Z.jsonl', 'utf-8');
  const lines = jsonlContent.split('\n').filter(line => line.trim());

  // Track new capabilities to avoid duplicates
  const newCapabilities = new Map<string, {
    name: string;
    description: string;
    category: string;
  }>();

  // Process each line
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      const response = JSON.parse(data.response.body.choices[0].message.content);
      
      // Extract new capabilities from each responsibility
      for (const responsibility of response.analysis_result.extracted_responsibilities) {
        if (responsibility.suggested_new_capability) {
          const { name, description } = responsibility.suggested_new_capability;
          if (name && description) {
            // Normalize the name to help with duplicate detection
            const normalizedName = name.trim().toLowerCase();
            newCapabilities.set(normalizedName, { 
              name: name.trim(), 
              description: description.trim(),
              category: 'Automation' // Default category
            });
          }
        }
      }
    } catch (err) {
      console.error('Error processing line:', err);
      continue;
    }
  }

  console.log(`Found ${newCapabilities.size} potential capabilities to process`);
  
  // Get all existing capabilities first
  const existingCapabilities = await storage.listAICapabilities({});
  const existingNameMap = new Map(existingCapabilities.map(cap => [cap.name.toLowerCase(), cap]));
  
  // Convert Map to array for iteration
  const capabilities = Array.from(newCapabilities.entries());
  
  for (const [normalizedName, capability] of capabilities) {
    try {
      const existingMatch = existingNameMap.get(normalizedName);
      
      if (existingMatch) {
        // If descriptions are different, update the existing capability
        if (existingMatch.description !== capability.description) {
          await sql`
            UPDATE ${aiCapabilitiesTable}
            SET description = ${existingMatch.description + '\n\nAlternative description: ' + capability.description},
                updated_at = NOW()
            WHERE id = ${existingMatch.id}
          `;
          
          console.log(`Updated existing capability: ${capability.name} (ID: ${existingMatch.id}) with merged description`);
        } else {
          console.log(`Skipping exact duplicate: ${capability.name}`);
        }
      } else {
        // Insert new capability
        const result = await storage.createAICapability({
          name: capability.name,
          description: capability.description,
          category: capability.category,
          implementation_effort: 'Medium',
          business_value: 'Medium',
          quick_implementation: false,
          has_dependencies: false,
          is_duplicate: false,
          // Let the database handle the ID generation
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Inserted new capability: ${capability.name} with ID ${result.id}`);
      }
    } catch (err) {
      console.error(`Error processing capability ${capability.name}:`, err);
    }
  }

  await storage.disconnect();
  console.log('Import completed');
  process.exit(0);
}

importCapabilities().catch(console.error); 