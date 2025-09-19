import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface InvitationFormState {
  id?: string;
  user_id: string;
  token: string;
  form_data: any;
  step: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/invitation/form-state - Get invitation form state
 */
export async function GET(request: NextRequest) {
  try {
    // Validate invitation token
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { request: authenticatedRequest } = authResult;
    const { userId, token } = authenticatedRequest.auth!;

    console.log('Fetching form state for user:', userId, 'token:', token);

    // Get form state from database
    const { data, error } = await supabase
      .from('invitation_form_states')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Failed to fetch form state: ${error.message}` },
        { status: 500 }
      );
    }

    // Return form state or empty state if not found
    const formState = data || {
      user_id: userId,
      token: token,
      form_data: {},
      step: 'initial',
      completed: false
    };

    console.log('Form state retrieved:', formState);
    return NextResponse.json({ formState });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitation/form-state - Save invitation form state
 */
export async function POST(request: NextRequest) {
  try {
    // Validate invitation token
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { request: authenticatedRequest } = authResult;
    const { userId, token } = authenticatedRequest.auth!;

    const body = await request.json();
    const { form_data, step, completed = false } = body;

    if (!form_data || !step) {
      return NextResponse.json(
        { error: 'form_data and step are required' },
        { status: 400 }
      );
    }

    console.log('Saving form state for user:', userId, 'step:', step);

    // Upsert form state
    const { data, error } = await supabase
      .from('invitation_form_states')
      .upsert({
        user_id: userId,
        token: token,
        form_data: form_data,
        step: step,
        completed: completed,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Failed to save form state: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Form state saved:', data);
    return NextResponse.json({ formState: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invitation/form-state - Update invitation form state
 */
export async function PUT(request: NextRequest) {
  try {
    // Validate invitation token
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { request: authenticatedRequest } = authResult;
    const { userId, token } = authenticatedRequest.auth!;

    const body = await request.json();
    const { form_data, step, completed } = body;

    console.log('Updating form state for user:', userId);

    // Update form state
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (form_data !== undefined) updateData.form_data = form_data;
    if (step !== undefined) updateData.step = step;
    if (completed !== undefined) updateData.completed = completed;

    const { data, error } = await supabase
      .from('invitation_form_states')
      .update(updateData)
      .eq('user_id', userId)
      .eq('token', token)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Failed to update form state: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Form state updated:', data);
    return NextResponse.json({ formState: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invitation/form-state - Delete invitation form state
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate invitation token
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { request: authenticatedRequest } = authResult;
    const { userId, token } = authenticatedRequest.auth!;

    console.log('Deleting form state for user:', userId);

    // Delete form state
    const { error } = await supabase
      .from('invitation_form_states')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Failed to delete form state: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Form state deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
