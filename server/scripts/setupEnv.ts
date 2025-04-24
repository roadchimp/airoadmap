import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Helper script to set up environment variables for PostgreSQL
 */
async function setupPostgresEnv() {
  console.log('Setting up PostgreSQL environment variables...');
  
  try {
    // Check if .env.local already exists
    let existingVars = {};
    try {
      const envContent = await readFile(path.resolve(process.cwd(), '.env.local'), 'utf-8');
      
      // Parse existing variables
      envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            existingVars[key.trim()] = value.trim();
          }
        }
      });
      
      console.log('Found existing .env.local file with the following variables:');
      Object.keys(existingVars).forEach(key => {
        if (key === 'DATABASE_URL') {
          console.log(`- ${key}=******** (value hidden)`);
        } else if (key.includes('PASSWORD')) {
          console.log(`- ${key}=******** (value hidden)`);
        } else {
          console.log(`- ${key}=${existingVars[key]}`);
        }
      });
    } catch (error) {
      console.log('No existing .env.local file found. Creating a new one.');
    }
    
    // Ask for PostgreSQL connection details
    console.log('\nPlease enter your PostgreSQL connection details:');
    
    // If DATABASE_URL exists, ask if user wants to change it
    if (existingVars['DATABASE_URL']) {
      const change = await question('A DATABASE_URL is already set. Do you want to change it? (y/N): ');
      if (change.toLowerCase() !== 'y') {
        console.log('Keeping existing DATABASE_URL.');
        rl.close();
        return;
      }
    }
    
    // Get PostgreSQL connection details
    const host = await question('Host (default: localhost): ') || 'localhost';
    const port = await question('Port (default: 5432): ') || '5432';
    const database = await question('Database name (default: airoadmap): ') || 'airoadmap';
    const username = await question('Username (default: postgres): ') || 'postgres';
    const password = await question('Password (default: postgres): ') || 'postgres';
    
    // Create DATABASE_URL
    const databaseUrl = `postgres://${username}:${password}@${host}:${port}/${database}`;
    
    // Update existingVars with new DATABASE_URL
    existingVars['DATABASE_URL'] = databaseUrl;
    
    // Create .env.local content
    let envContent = '';
    Object.entries(existingVars).forEach(([key, value]) => {
      envContent += `${key}=${value}\n`;
    });
    
    // Write to .env.local
    await writeFile(path.resolve(process.cwd(), '.env.local'), envContent);
    
    console.log('\nEnvironment variables have been set up successfully!');
    console.log('The DATABASE_URL has been added to .env.local');
    console.log('\nYou can now run the following commands:');
    console.log('1. npx tsx server/scripts/exportMemStorage.ts');
    console.log('2. npx tsx server/scripts/migrateToPostgres.ts');
    console.log('3. npx tsx server/scripts/runScraper.ts');
    
  } catch (error) {
    console.error('Error setting up environment variables:', error);
  } finally {
    rl.close();
  }
}

// Run setup function
setupPostgresEnv(); 