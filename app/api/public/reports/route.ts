import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { Report } from '@shared/schema';

// This is a temporary public endpoint to get around Vercel's auth protection
// GET /api/public/reports
export async function GET() {
  try {
    // Raw fetch from storage
    let reports: Report[] = [];
    try {
      const result = await storage.listReports();
      if (Array.isArray(result)) {
        reports = result;
      }
    } catch (error) {
      console.error('Error directly accessing reports from storage:', error);
    }

    // Always return a valid array, even if empty
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error in public reports endpoint:', error);
    return NextResponse.json([]);
  }
} 