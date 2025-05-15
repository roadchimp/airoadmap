import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertMetricRuleSchema } from '@shared/schema'; // Import schema for validation
import { z } from 'zod'; // Import z

// GET /api/metric-rules
// Lists all metric rules
export async function GET() {
  try {
    const rules = await storage.listMetricRules();
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error listing metric rules:', error);
    return NextResponse.json({ message: 'Failed to retrieve metric rules.' }, { status: 500 });
  }
}

// POST /api/metric-rules
// Creates a new metric rule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate the request body against the schema
    const validatedData = insertMetricRuleSchema.parse(body);

    const newRule = await storage.insertMetricRule(validatedData);
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Error creating metric rule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create metric rule.' }, { status: 500 });
  }
}

// PATCH /api/metric-rules/:id
// Updates an existing metric rule
// Note: Ideally in app/api/metric-rules/[id]/route.ts
export async function PATCH(request: Request) {
   const { pathname } = new URL(request.url);
   const id = parseInt(pathname.split('/').pop() || '');

   if (isNaN(id)) {
     return NextResponse.json({ message: 'Invalid metric rule ID provided.' }, { status: 400 });
   }

  try {
    const body = await request.json();
    // Use partial() for update validation
    const validatedData = insertMetricRuleSchema.partial().parse(body);

    const updatedRule = await storage.updateMetricRule(id, validatedData);

    if (!updatedRule) {
        return NextResponse.json({ message: 'Metric rule not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error(`Error updating metric rule ${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update metric rule.' }, { status: 500 });
  }
}

// DELETE /api/metric-rules/:id
// Deletes a metric rule
// Note: Ideally in app/api/metric-rules/[id]/route.ts
export async function DELETE(request: Request) {
   const { pathname } = new URL(request.url);
   const id = parseInt(pathname.split('/').pop() || '');

   if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid metric rule ID provided.' }, { status: 400 });
  }

  try {
    await storage.deleteMetricRule(id);
    return NextResponse.json({ message: 'Metric rule deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting metric rule ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete metric rule.' }, { status: 500 });
  }
} 