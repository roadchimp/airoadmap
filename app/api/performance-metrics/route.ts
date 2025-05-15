import { NextResponse } from 'next/server';
import { storage } from '@/server/storage'; // Assuming storage is exported from server/storage.ts
import { insertPerformanceMetricSchema } from '@shared/schema'; // Import schema for validation
import { z } from 'zod'; // Import z

// GET /api/performance-metrics
// Lists all performance metrics
export async function GET() {
  try {
    const metrics = await storage.listPerformanceMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error listing performance metrics:', error);
    return NextResponse.json({ message: 'Failed to retrieve performance metrics.' }, { status: 500 });
  }
}

// POST /api/performance-metrics
// Creates a new performance metric
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate the request body against the schema
    const validatedData = insertPerformanceMetricSchema.parse(body);

    const newMetric = await storage.createPerformanceMetric(validatedData);
    return NextResponse.json(newMetric, { status: 201 });
  } catch (error) {
    console.error('Error creating performance metric:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create performance metric.' }, { status: 500 });
  }
}

// PATCH /api/performance-metrics/:id
// Updates an existing performance metric
// Note: Next.js App Router dynamic segments use folder names, so this handler is for the route group `(app)/api/performance-metrics/[id]/route.ts`
// For now, we'll implement the logic here assuming the ID comes from the request body or query param.
// A more idiomatic App Router approach would be a separate [id] route file.
export async function PATCH(request: Request) {
   // This handler should ideally be in app/api/performance-metrics/[id]/route.ts
   // We'll use a workaround to get the ID from the URL for demonstration purposes in this single file.
  const { pathname } = new URL(request.url);
  const id = parseInt(pathname.split('/').pop() || '');

  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid metric ID provided.' }, { status: 400 });
  }

  try {
    const body = await request.json();
     // We can reuse the insert schema for partial validation, or create a specific update schema
     // Using partial() from Zod allows updating only provided fields.
    const validatedData = insertPerformanceMetricSchema.partial().parse(body);

    const updatedMetric = await storage.updatePerformanceMetric(id, validatedData);

    if (!updatedMetric) {
        return NextResponse.json({ message: 'Performance metric not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedMetric);
  } catch (error) {
    console.error(`Error updating performance metric ${id}:`, error);
     if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update performance metric.' }, { status: 500 });
  }
}

// DELETE /api/performance-metrics/:id
// Deletes a performance metric
// Note: Similar to PATCH, this should ideally be in app/api/performance-metrics/[id]/route.ts
export async function DELETE(request: Request) {
   // Using workaround to get ID from URL
  const { pathname } = new URL(request.url);
  const id = parseInt(pathname.split('/').pop() || '');

   if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid metric ID provided.' }, { status: 400 });
  }

  try {
    await storage.deletePerformanceMetric(id);
    return NextResponse.json({ message: 'Performance metric deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting performance metric ${id}:`, error);
     // Check for specific errors, e.g., if the metric was not found before attempting deletion
    // For now, a generic 500 for simplicity
    return NextResponse.json({ message: 'Failed to delete performance metric.' }, { status: 500 });
  }
}

// TODO: Add POST, PATCH, DELETE handlers for Performance Metrics 