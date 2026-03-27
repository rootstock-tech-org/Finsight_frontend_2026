import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/middleware/auth-middleware';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

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

function fapiHeaders(userId: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${userId}` };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, token } = authResult.request.auth!;

    const res = await fetch(
      `${FASTAPI}/invitation/form-state?user_id=${userId}&token=${token}`,
      { headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" } }
    );

    if (!res.ok && res.status !== 404) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? 'Failed to fetch form state' }, { status: 500 });
    }

    const formState: InvitationFormState = res.status === 404
      ? { user_id: userId, token, form_data: {}, step: 'initial', completed: false }
      : await res.json();

    return NextResponse.json({ formState });
  } catch (error) {
    console.error('GET /api/invitation/form-state error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, token } = authResult.request.auth!;
    const body = await request.json();
    const { form_data, step, completed = false } = body;

    if (!form_data || !step) {
      return NextResponse.json({ error: 'form_data and step are required' }, { status: 400 });
    }

    const res = await fetch(`${FASTAPI}/invitation/form-state`, {
      method: 'POST',
      headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ user_id: userId, token, form_data, step, completed }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? 'Failed to save form state' }, { status: 500 });
    }

    const formState = await res.json();
    return NextResponse.json({ formState });
  } catch (error) {
    console.error('POST /api/invitation/form-state error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, token } = authResult.request.auth!;
    const body = await request.json();

    const res = await fetch(`${FASTAPI}/invitation/form-state`, {
      method: 'PUT',
      headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ user_id: userId, token, ...body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? 'Failed to update form state' }, { status: 500 });
    }

    const formState = await res.json();
    return NextResponse.json({ formState });
  } catch (error) {
    console.error('PUT /api/invitation/form-state error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await AuthMiddleware.validateInvitationToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, token } = authResult.request.auth!;

    const res = await fetch(
      `${FASTAPI}/invitation/form-state?user_id=${userId}&token=${token}`,
      { method: 'DELETE', headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? 'Failed to delete form state' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/invitation/form-state error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}