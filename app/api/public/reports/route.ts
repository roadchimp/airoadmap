import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { Report } from '@shared/schema';
import { unstable_noStore } from 'next/cache';

// This is a temporary public endpoint to get around Vercel's auth protection
// GET /api/public/reports
export async function GET() {
  // Disable caching for this route
  unstable_noStore();
  
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

    // Sort reports by generatedAt timestamp (most recent first)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    // Return data with cache control headers
    return new NextResponse(JSON.stringify(sortedReports), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in public reports endpoint:', error);
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
} 