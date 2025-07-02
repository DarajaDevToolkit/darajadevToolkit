import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authApi, ApiError } from '@/utils/axios';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = loginSchema.parse(body);

    const response = await authApi.login(parsedBody.email, parsedBody.password);

    return NextResponse.json({
      message: 'Login successful',
      user: response.user,
      accessToken: response.accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}