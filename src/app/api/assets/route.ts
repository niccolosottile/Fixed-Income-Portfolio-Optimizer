import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('fixed_income_assets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('fixed_income_assets')
      .insert([body])
      .select();
      
    if (error) {
      console.error('Supabase error creating asset:', error);
      return NextResponse.json({ 
        error: 'Failed to create asset', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data returned after insert' }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ 
      error: 'Failed to create asset', 
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
