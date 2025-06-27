import { NextResponse } from 'next/server';

// This endpoint has been consolidated into /api/roles-departments
// Providing a redirect/wrapper for backward compatibility
export async function GET(request: Request) {
  try {
    // Get the consolidated data from the main endpoint
    const baseUrl = new URL(request.url).origin;
    const response = await fetch(`${baseUrl}/api/roles-departments`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch roles-departments: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract just the departments (hierarchical) for backward compatibility
    const departments = data.hierarchical || [];
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
} 