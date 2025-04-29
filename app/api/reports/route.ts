import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertReportSchema } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/reports
export async function GET() {
  try {
    const reports = await storage.listReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/reports
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertReportSchema.parse(body);
    const report = await storage.createReport(validatedData);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid report data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid report data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 