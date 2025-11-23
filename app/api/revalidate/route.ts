import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (token !== process.env.REVALIDATE_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    revalidateTag('dashboard-data');
    
    return NextResponse.json(
      { 
        revalidated: true, 
        timestamp: new Date().toISOString() 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error revalidating cache' },
      { status: 500 }
    );
  }
}