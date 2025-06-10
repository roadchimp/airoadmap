import { NextResponse } from 'next/server';

export async function GET() {
  console.log("Health check endpoint was hit successfully.");
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function POST() {
    console.log("Health check endpoint was hit successfully via POST.");
    return NextResponse.json({ status: 'ok' }, { status: 200 });
} 