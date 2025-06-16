import { NextResponse } from 'next/server';
import { getTrainingProgram } from '@/lib/csv';

export async function GET() {
  try {
    const trainingProgram = await getTrainingProgram();
    return NextResponse.json(trainingProgram);
  } catch (error) {
    console.error('Error fetching training program:', error);
    return NextResponse.json({ error: 'Failed to fetch training program' }, { status: 500 });
  }
}
