import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FixedIncomeAsset } from '@/types';

export async function GET() {
  try {
    // Create server client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user ID
    const user_id = user.id;
    
    // Get assets for the authenticated user
    const { data, error } = await supabase
      .from('fixed_income_assets')
      .select('*')
      .eq('user_id', user_id)
      .order('maturity_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data as FixedIncomeAsset[]);
  } catch (error) {
    console.error('Error handling assets fetch:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Create server client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user ID
    const user_id = user.id;
    
    // Parse the request body
    const body = await request.json();
    
    // Create a new asset with correct user_id
    const newAsset = {
      ...body,
      user_id: user_id
    };
    
    // Insert the asset
    const { data, error } = await supabase
      .from('fixed_income_assets')
      .insert(newAsset)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating asset:', error);
      return NextResponse.json(
        { error: 'Failed to create asset', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data as FixedIncomeAsset);
  } catch (error) {
    console.error('Error handling asset creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Create server client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user ID
    const user_id = user.id;
    
    // Get the asset ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing asset ID' },
        { status: 400 }
      );
    }
    
    // Delete the asset (ensuring it belongs to the current user)
    const { error } = await supabase
      .from('fixed_income_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);
    
    if (error) {
      console.error('Error deleting asset:', error);
      return NextResponse.json(
        { error: 'Failed to delete asset' },
        { status: 500 }
      );
    }
    
    // Return success
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error handling asset deletion:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
