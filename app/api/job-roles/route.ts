import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorage } from '@/server/storage';

// This schema now matches the data structure sent from the client
const createJobRoleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  departmentId: z.number(),
  keyResponsibilities: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = createJobRoleSchema.parse(json);

    const storage = getStorage();
    // The data is now in the correct format for the storage function
    const newJobRole = await storage.createJobRole(parsedData);

    return NextResponse.json(newJobRole, { status: 201 });
  } catch (error) {
    console.error('Error creating job role:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 