import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Define the expected structure of a capability object in the JSON file
interface SeedCapability {
  id: number;
  name: string;
  description: string;
}

// Define default values for fields not present in the seed file
const DEFAULT_CATEGORY = 'Core Function'; // Example default, adjust if needed
const DEFAULT_BUSINESS_VALUE = 'Medium';
const DEFAULT_IMPLEMENTATION_EFFORT = 'Medium';
const DEFAULT_EASE_SCORE = 3; // Example default
const DEFAULT_VALUE_SCORE = 3; // Example default

// Derive the directory name from the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedCapabilities() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'airoadmap',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  let client; // Declare client outside the try block

  try {
    client = await pool.connect();
    console.log('Connected to database.');

    // Construct the absolute path to the JSON file
    // Go up one level from scripts/ to server/, then into batch-processing/
    const jsonPath = path.resolve(__dirname, '..', 'batch-processing', 'SDR_capabilities_clean.json');
    console.log(`Reading capabilities from: ${jsonPath}`);

    if (!fs.existsSync(jsonPath)) {
      console.error(`Error: Seed file not found at ${jsonPath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const capabilities: SeedCapability[] = JSON.parse(fileContent);

    console.log(`Found ${capabilities.length} capabilities in the seed file.`);

    // Begin transaction
    await client.query('BEGIN');

    let insertedCount = 0;
    for (const cap of capabilities) {
      try {
        const result = await client.query(
          `INSERT INTO ai_capabilities
             (id, name, description, category, business_value, implementation_effort, ease_score, value_score, created_at, updated_at)
           VALUES
             ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`, // Use the ID from the file, do nothing if it exists
          [
            cap.id,
            cap.name,
            cap.description,
            DEFAULT_CATEGORY,
            DEFAULT_BUSINESS_VALUE,
            DEFAULT_IMPLEMENTATION_EFFORT,
            DEFAULT_EASE_SCORE,
            DEFAULT_VALUE_SCORE,
          ]
        );
        if (result.rowCount > 0) {
          insertedCount++;
          console.log(`Inserted capability ID: ${cap.id} - ${cap.name}`);
        } else {
          console.log(`Skipped capability ID: ${cap.id} (already exists)`);
        }
      } catch (insertError) {
        console.error(`Error inserting capability ID ${cap.id}:`, insertError);
        // Decide if you want to rollback on individual error or continue
        // throw insertError; // Uncomment to stop on first error
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`Seeding complete. Inserted ${insertedCount} new capabilities.`);

  } catch (error) {
    console.error('Error during capability seeding:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back.');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    process.exit(1); // Exit with error code
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
      console.log('Database client released.');
    }
    await pool.end(); // Close all connections in the pool
    console.log('Database pool closed.');
  }
}

seedCapabilities(); 