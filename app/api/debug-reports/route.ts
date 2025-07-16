import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Ensure storage is initialized
    await (storage as any).ensureInitialized();
    
    // Get the database instance from storage
    const db = (storage as any).db;
    
    // Check if reports table exists and its structure
    const tableInfo = await db.execute(
      sql`SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'reports' 
          ORDER BY ordinal_position`
    );
    
    // Try a simple count to see if the table is accessible
    const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM reports`);
    
    // Try to list a few reports using raw SQL
    const reportsRaw = await db.execute(sql`SELECT id, assessment_id, user_id, generated_at FROM reports LIMIT 5`);
    
    return NextResponse.json({
      success: true,
      tableInfo: tableInfo.rows || tableInfo,
      totalReports: countResult.rows?.[0] || countResult[0],
      sampleReports: reportsRaw.rows || reportsRaw,
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 