import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authApi, ApiError } from '@/utils/axios';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = registerSchema.parse(body);

    const response = await authApi.register(parsedBody);

    return NextResponse.json({
      message: 'Registration successful',
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
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
