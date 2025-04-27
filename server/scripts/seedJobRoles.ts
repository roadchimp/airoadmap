import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

interface RoleSeedData {
  title: string;
  departmentName: string; // Use name initially, we'll look up/create ID
  description: string;
  keyResponsibilitiesRaw: string; // Store the raw string first
  // aiPotential: 'High' | 'Medium' | 'Low' | null; // We'll leave this null for now as it's not explicit
}

// --- Data derived from user prompt ---
const rolesToSeed: RoleSeedData[] = [
  {
    title: 'Sales (e.g., Regional Sales Manager)',
    departmentName: 'Sales',
    description: 'Responsible for driving revenue by acquiring new customers and closing deals.',
    keyResponsibilitiesRaw: `
      - Lead generation
      - Customer engagement
      - Deal closure
      - Sales forecasting
    `,
  },
  {
    title: 'Marketing',
    departmentName: 'Marketing',
    description: 'Focuses on creating brand awareness, generating leads, and developing marketing strategies.',
    keyResponsibilitiesRaw: `
      - Campaign creation
      - Brand management
      - Content development
      - Lead generation
    `,
  },
  {
    title: 'Sales Development Representative (SDR)',
    departmentName: 'Sales', // Or Marketing, clarified as Sales/Marketing - let's use Sales for now
    description: 'Specializes in the initial stages of the sales process, focusing on outreach and qualifying leads.',
    keyResponsibilitiesRaw: `
      - Initial outreach
      - Lead qualification
      - Meeting scheduling
    `,
  },
  {
    title: 'Customer Success Manager (CSM)',
    departmentName: 'Customer Success',
    description: 'Manages customer relationships post-sale to ensure satisfaction, retention, and expansion. Collaborates with sales on opportunities.',
    keyResponsibilitiesRaw: `
      - Customer Onboarding
      - Relationship management
      - Retention strategies
      - Upsell/cross-sell
      - Sales collaboration
    `,
  },
  {
    title: 'Sales Engineer / Solutions Engineer (SE)',
    departmentName: 'Sales', // Clarified as Sales/Technical Sales - let's use Sales
    description: 'Provides technical expertise during the sales process, demonstrating product value, designing solutions, and supporting onboarding and engagement.',
    keyResponsibilitiesRaw: `
      - Technical support during sales
      - Customer onboarding
      - Customer engagement
      - Product demos
      - Solution design
      - Data analysis
      - Technical support/documentation
    `,
  },
  {
    title: 'Customer Support (CS)',
    departmentName: 'Support', // Clarified as Support/Service - let's use Support
    description: 'Assists customers with resolving issues, answering questions, and providing documentation.',
    keyResponsibilitiesRaw: `
      - Issue resolution
      - Support documentation creation
      - Ticket management
    `,
  },
  {
    title: 'Operations (Ops) / Revenue Operations',
    departmentName: 'Operations', // Clarified as Operations/Revenue Operations - let's use Operations
    description: 'Optimizes processes, manages data, administers tools, handles forecasting, and oversees resource allocation and training to support GTM functions.',
    keyResponsibilitiesRaw: `
      - Process optimization
      - Data analysis
      - Resource management
      - Sales forecasting
      - Customer success forecasting
      - Systems/tools administration
      - Sales training
    `,
  },
  {
    title: 'Seller Productivity / Enablement',
    departmentName: 'Sales', // Can vary (Sales/Ops/Marketing) - let's default to Sales
    description: 'Focuses on improving the efficiency and effectiveness of the sales team through training, content, process optimization, and data analysis.',
    keyResponsibilitiesRaw: `
      - Sales training
      - Data analysis
      - Process optimization
      - Content creation
      - Campaign creation
      - Sales enablement tools management
    `,
  },
  {
    title: 'Systems / IT / Infrastructure',
    departmentName: 'IT', // Clarified as IT/Engineering - let's use IT
    description: "Manages the company's technology infrastructure, software integrations, system monitoring, and provides related support and documentation.",
    keyResponsibilitiesRaw: `
      - Infrastructure management
      - Software integration
      - Monitoring & support
      - Support documentation
    `,
  },
];
// --- End Data ---


async function seedJobRoles() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'airoadmap',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  let client;
  const departmentNameToIdMap = new Map<string, number>();

  try {
    client = await pool.connect();
    console.log('Connected to database.');

    // 1. Ensure Departments Exist and Get IDs
    console.log('Ensuring departments exist...');
    const uniqueDepartmentNames = [...new Set(rolesToSeed.map(role => role.departmentName))];

    // Check existing departments
    const existingDeptsResult = await client.query('SELECT id, name FROM departments WHERE name = ANY($1::text[])', [uniqueDepartmentNames]);
    existingDeptsResult.rows.forEach(row => {
      departmentNameToIdMap.set(row.name, row.id);
      console.log(`Department '${row.name}' already exists with ID ${row.id}`);
    });

    // Insert missing departments
    const missingDepartmentNames = uniqueDepartmentNames.filter(name => !departmentNameToIdMap.has(name));
    for (const deptName of missingDepartmentNames) {
      console.log(`Inserting missing department: '${deptName}'`);
      // Temporarily removed ON CONFLICT for debugging potential schema sync issues
      const insertResult = await client.query(
        'INSERT INTO departments (name) VALUES ($1) RETURNING id, name',
        [deptName]
      );
      if (insertResult.rows.length > 0) {
         departmentNameToIdMap.set(insertResult.rows[0].name, insertResult.rows[0].id);
         console.log(`Inserted department '${insertResult.rows[0].name}' with ID ${insertResult.rows[0].id}`);
      } else {
         // This might happen if ON CONFLICT DO UPDATE runs but doesn't return, re-query
         const requeryResult = await client.query('SELECT id, name FROM departments WHERE name = $1', [deptName]);
         if(requeryResult.rows.length > 0) {
             departmentNameToIdMap.set(requeryResult.rows[0].name, requeryResult.rows[0].id);
             console.log(`Department '${requeryResult.rows[0].name}' likely existed, found ID ${requeryResult.rows[0].id}`);
         } else {
            console.error(`Failed to insert or find department: ${deptName}`);
            // Optionally throw an error or handle appropriately
         }
      }
    }
    console.log('Department check complete.');


    // 2. Insert Job Roles
    console.log('Inserting job roles...');
    await client.query('BEGIN'); // Start transaction

    let insertedCount = 0;
    let skippedCount = 0;
    for (const role of rolesToSeed) {
      const departmentId = departmentNameToIdMap.get(role.departmentName);
      if (!departmentId) {
        console.error(`Skipping role '${role.title}' because department ID for '${role.departmentName}' could not be found.`);
        skippedCount++;
        continue;
      }

      // Process responsibilities: split string, trim lines, filter empty ones
      const keyResponsibilities = role.keyResponsibilitiesRaw
        .split('\n')
        .map(line => line.replace(/^- /, '').trim()) // Remove leading dash and trim
        .filter(line => line.length > 0);

      try {
        // Temporarily removed ON CONFLICT for debugging potential schema sync issues
        const result = await client.query(
          `INSERT INTO job_roles
             (title, department_id, description, key_responsibilities, ai_potential)
           VALUES
             ($1, $2, $3, $4, $5)`,
          [
            role.title,
            departmentId,
            role.description,
            keyResponsibilities, // Pass the array directly
            null, // Set aiPotential to null for now
          ]
        );
        if (result.rowCount > 0) {
          insertedCount++;
          console.log(`Inserted job role: ${role.title}`);
        } else {
          skippedCount++;
          console.log(`Skipped job role (already exists?): ${role.title}`);
        }
      } catch (insertError) {
        console.error(`Error inserting job role '${role.title}':`, insertError);
        skippedCount++;
        // Decide if you want to rollback on individual error or continue
        // Consider adding `await client.query('ROLLBACK'); throw insertError;` here to stop
      }
    }

    await client.query('COMMIT'); // Commit transaction
    console.log(`Job role seeding complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('Error during job role seeding:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back due to error.');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
    await pool.end();
    console.log('Database pool closed.');
  }
}

seedJobRoles(); 