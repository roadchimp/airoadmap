import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';
import dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';

// Determine environment and load appropriate .env file
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env';
dotenv.config({ path: envFile });

console.log(`Running seed script in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode.`);
console.log(`Loading environment variables from: ${envFile}`);

// Get connection string based on environment
const connectionString = isProduction 
  ? process.env.DATABASE_POSTGRES_URL 
  : process.env.DATABASE_URL;
  
const dbUrlVarName = isProduction ? 'DATABASE_POSTGRES_URL' : 'DATABASE_URL';

if (!connectionString) {
  console.error(`Error: ${dbUrlVarName} environment variable not set.`);
  console.error(`Ensure it is defined in ${envFile}`);
  process.exit(1);
}

let db: any; // Drizzle instance type depends on environment
let pool: Pool | undefined; // Only used for local pg

try {
  console.log('Initializing database connection...');
  if (isProduction) {
    // Production: Use Neon HTTP
    const sql = neon(connectionString);
    db = drizzleNeonHttp(sql, { schema });
    console.log('Neon HTTP database connection initialized.');
  } else {
    // Development: Use standard node-postgres Pool
    pool = new Pool({ connectionString });
    db = drizzleNodePostgres(pool, { schema });
    console.log('Standard PostgreSQL database connection initialized.');
  }
} catch (error) {
    console.error('Failed to initialize database connection:', error);
    process.exit(1);
}

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // --- 1. Seed Departments ---
    console.log('Seeding departments...');
    const departmentsData: schema.InsertDepartment[] = [
      { name: "Sales & Marketing", description: "Handles all sales and marketing activities" },
      { name: "Customer Support", description: "Provides support to customers" },
      { name: "Finance", description: "Manages financial operations" },
      { name: "Human Resources", description: "Handles employee management and recruitment" },
      { name: "Engineering", description: "Develops and maintains products" },
      { name: "Operations", description: "Oversees day-to-day business operations" }
    ];

    const insertedDepts = await db.insert(schema.departments)
      .values(departmentsData)
      .onConflictDoNothing()
      .returning();
    console.log(`Inserted ${insertedDepts.length} new departments.`);

    // Fetch all departments to get IDs for job roles
    const allDepartments = await db.select().from(schema.departments);
    // Explicitly type 'd' here
    const departmentMap = new Map(allDepartments.map((d: schema.Department) => [d.name, d.id]));
    console.log('Departments map created.');

    // --- 2. Seed Job Roles ---
    console.log('Seeding job roles...');
    const jobRolesData: schema.InsertJobRole[] = [
        // Explicitly cast departmentMap.get result to number
      {
        title: "Sales Operations Specialist",
        departmentId: departmentMap.get("Sales & Marketing")! as number,
        description: "Manages RFP responses, sales data analysis, and CRM maintenance",
        keyResponsibilities: ["Manage RFP responses", "Maintain sales data", "Perform CRM analysis", "Create sales reports", "Support proposal creation"],
        aiPotential: "High"
      },
      {
        title: "Content Marketing Manager",
        departmentId: departmentMap.get("Sales & Marketing")! as number,
        description: "Creates and distributes content for marketing campaigns",
        keyResponsibilities: ["Create marketing content", "Manage editorial calendar", "Coordinate content distribution", "Analyze content performance", "Develop content strategy"],
        aiPotential: "Medium"
      },
      {
        title: "Digital Marketing Specialist",
        departmentId: departmentMap.get("Sales & Marketing")! as number,
        description: "Manages online advertising and campaign analysis",
        keyResponsibilities: ["Manage online ad campaigns", "Analyze marketing data", "Optimize conversion rates", "Report on marketing KPIs", "Conduct A/B testing"],
        aiPotential: "Medium"
      },
      {
        title: "Customer Support Agent",
        departmentId: departmentMap.get("Customer Support")! as number,
        description: "Handles tier 1 customer inquiries via chat, email, and phone",
        keyResponsibilities: ["Handle customer inquiries", "Troubleshoot basic issues", "Escalate complex problems", "Maintain customer records", "Follow up on resolved issues"],
        aiPotential: "High"
      },
      {
        title: "Technical Support Specialist",
        departmentId: departmentMap.get("Customer Support")! as number,
        description: "Resolves complex technical issues and product-specific problems",
        keyResponsibilities: ["Diagnose technical problems", "Provide advanced troubleshooting", "Document solutions", "Train junior support staff", "Contribute to knowledge base"],
        aiPotential: "Medium"
      }
    ];

    const insertedRoles = await db.insert(schema.jobRoles)
      .values(jobRolesData)
      .onConflictDoNothing()
      .returning(); 
    console.log(`Inserted ${insertedRoles.length} new job roles.`);

    // --- 3. Seed AI Capabilities ---
    console.log('Seeding AI capabilities...');
    // Add tags: [] to satisfy the base type, even though Zod schema handles default
    const capabilitiesData: schema.InsertAICapability[] = [
      { id: 1, name: "Automated Document Processing", category: "Document Management", description: "AI-powered document processing and analysis", implementationEffort: "Medium", businessValue: "High", tags: [] },
      { id: 2, name: "Predictive Analytics", category: "Data Analysis", description: "Advanced predictive modeling and forecasting", implementationEffort: "High", businessValue: "Very High", tags: [] },
      { id: 3, name: "Natural Language Processing", category: "Text Analysis", description: "Understanding and processing human language", implementationEffort: "Medium", businessValue: "High", tags: [] },
      { id: 4, name: "Image Recognition", category: "Computer Vision", description: "AI-powered image analysis and recognition", implementationEffort: "High", businessValue: "Medium", tags: [] },
      { id: 5, name: "Process Automation", category: "Workflow", description: "Automating repetitive business processes", implementationEffort: "Low", businessValue: "High", tags: [] }
    ];

    const insertedCapabilities = await db.insert(schema.aiCapabilities)
       .values(capabilitiesData) 
       .onConflictDoUpdate({ 
         target: schema.aiCapabilities.id, 
         set: { 
             name: sql`excluded.name`, 
             category: sql`excluded.category`,
             description: sql`excluded.description`,
             implementationEffort: sql`excluded.implementation_effort`,
             businessValue: sql`excluded.business_value`,
             // Add other fields from capabilitiesData if needed for update
             updatedAt: new Date()
         }
       })
       .returning();
    console.log(`Upserted ${insertedCapabilities.length} AI capabilities.`);

    // --- 4. Seed User ---
    console.log('Seeding default user...');
    const userData: schema.InsertUser = {
        username: "consultant",
        password: "password123", // Placeholder - **HASH IN REAL APP**
        fullName: "Consultant User",
        email: "consultant@example.com",
        role: "consultant"
    };
    const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.username, userData.username),
    });
    if (!existingUser) {
        await db.insert(schema.users).values(userData);
        console.log(`Inserted default user '${userData.username}'.`);
    } else {
        console.log(`User '${userData.username}' already exists. Skipping.`);
    }

    // --- 5. Seed Job Scraper Configs ---
    console.log('Seeding job scraper configs...');
    const scraperConfigsData: schema.InsertJobScraperConfig[] = [
      { name: "LinkedIn Tech Jobs", targetWebsite: "linkedin", keywords: ["software engineer", "web developer", "frontend", "backend"], location: "San Francisco", isActive: true, cronSchedule: "0 0 * * *" },
      { name: "Indeed Data Science", targetWebsite: "indeed", keywords: ["data scientist", "machine learning", "AI", "data analyst"], location: "Remote", isActive: true, cronSchedule: "0 12 * * *" }
    ];

    const insertedConfigs = await db.insert(schema.jobScraperConfigs)
      .values(scraperConfigsData)
      .onConflictDoNothing() 
      .returning();
    console.log(`Inserted ${insertedConfigs.length} new job scraper configs.`);

    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    console.log('Closing database connection...');
    // Only end the pool if it was created (i.e., not in production)
    if (pool) {
        await pool.end();
        console.log('Local database connection pool closed.');
    } else {
        console.log('Neon connection does not require explicit closing.');
    }
  }
}

seedDatabase(); 