import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { storage } from '@/server/storage';

export async function POST() {
  // Only allow this in preview environment
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Migration endpoint only available in preview environment' }, { status: 403 });
  }

  try {
    // Ensure storage is initialized
    await storage.ensureInitialized();

    // Get the database instance from storage
    const db = (storage as any).db;
    
    // Check if user_id column exists in reports table
    const result = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'user_id'`
    );

    if (result.rows && result.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'user_id column already exists in reports table',
        columnExists: true 
      });
    }

    // Add the user_id column if it doesn't exist
    await db.execute(
      sql`ALTER TABLE "reports" ADD COLUMN "user_id" integer`
    );

    // Add the foreign key constraint
    await db.execute(
      sql`ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action`
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added user_id column to reports table',
      columnExists: false,
      migrationApplied: true
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 