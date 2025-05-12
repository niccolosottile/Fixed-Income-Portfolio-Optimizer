import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LiquidityEvent } from '@/types';

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
    
    // Validate the input
    if (!body.amount || !body.currency || !body.date || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new liquidity event
    const newEvent = {
      user_id: user_id,
      amount: body.amount,
      currency: body.currency,
      date: body.date,
      description: body.description
    };
    
    // Insert the event into the database
    const { data, error } = await supabase
      .from('liquidity_events')
      .insert(newEvent)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating liquidity event:', error);
      return NextResponse.json(
        { error: 'Failed to create liquidity event' },
        { status: 500 }
      );
    }
    
    // Return the created event
    return NextResponse.json(data as LiquidityEvent);
    
  } catch (error) {
    console.error('Error handling liquidity event creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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
    
    // Get all liquidity events for the user
    const { data, error } = await supabase
      .from('liquidity_events')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching liquidity events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch liquidity events' },
        { status: 500 }
      );
    }
    
    // Return the liquidity events
    return NextResponse.json(data as LiquidityEvent[]);
    
  } catch (error) {
    console.error('Error handling liquidity events fetch:', error);
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
    
    // Get the event ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing event ID' },
        { status: 400 }
      );
    }
    
    // Delete the event (ensuring it belongs to the current user)
    const { error } = await supabase
      .from('liquidity_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);
    
    if (error) {
      console.error('Error deleting liquidity event:', error);
      return NextResponse.json(
        { error: 'Failed to delete liquidity event' },
        { status: 500 }
      );
    }
    
    // Return success
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error handling liquidity event deletion:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}