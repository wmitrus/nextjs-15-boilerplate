import { NextRequest, NextResponse } from 'next/server';

import { loginSchema, loginResponseSchema } from '@/app/login/validation';

// Mock user database - in a real app, this would be a database
const mockUsers = [
  {
    id: '1',
    email: 'demo@example.com',
    password: 'demo123', // In production, this would be hashed
    name: 'Demo User',
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body using Zod
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((issue) => issue.message)
        .join(', ');

      const errorResponse = loginResponseSchema.parse({
        success: false,
        message: `Validation failed: ${errorMessages}`,
      });

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { email, password } = validationResult.data;

    // Find user in mock database
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      const errorResponse = loginResponseSchema.parse({
        success: false,
        message: 'Invalid email or password',
      });

      return NextResponse.json(errorResponse, { status: 401 });
    }

    // In a real application, you would:
    // 1. Hash and compare passwords securely
    // 2. Generate JWT tokens or session cookies
    // 3. Set secure HTTP-only cookies
    // 4. Implement rate limiting
    // 5. Log authentication attempts

    const successResponse = loginResponseSchema.parse({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: unknown) {
    console.error('Login API error:', error);

    const errorResponse = loginResponseSchema.parse({
      success: false,
      message: 'Internal server error',
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
