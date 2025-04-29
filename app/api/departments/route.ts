import { NextResponse } from 'next/server';
import { storage } from '@/server/storage'; // Assuming @/server alias points to server/

export async function GET() {
  try {
    const departments = await storage.listDepartments();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    // Determine the type of error and respond accordingly
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;

    // Example: Check if it's a specific storage error if applicable
    // if (error instanceof SpecificStorageError) { 
    //   errorMessage = error.message;
    //   statusCode = error.statusCode || 500; 
    // } else if (error instanceof Error) {
    //   errorMessage = error.message; // Generic error message
    // }

    // For now, using a generic error response
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
} 