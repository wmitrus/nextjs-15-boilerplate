import { NextRequest } from 'next/server';

import { loginSchema } from '@/app/(app)/login/validation';
import { LoginResponseData } from '@/lib/api/auth';
import {
  createServerErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/responseService';

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
      const validationErrors: Record<string, string[]> = {};

      validationResult.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(issue.message);
      });

      return createValidationErrorResponse(validationErrors);
    }

    const { email, password } = validationResult.data;

    // Find user in mock database
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      return createValidationErrorResponse({
        credentials: ['Invalid email or password'],
      });
    }

    // In a real application, you would:
    // 1. Hash and compare passwords securely
    // 2. Generate JWT tokens or session cookies
    // 3. Set secure HTTP-only cookies
    // 4. Implement rate limiting
    // 5. Log authentication attempts

    const responseData: LoginResponseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    return createSuccessResponse(responseData);
  } catch (error: unknown) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(`Login failed: ${errorMessage}`);
  }
}

// Handle unsupported methods
export async function GET() {
  return createServerErrorResponse('Method not allowed');
}
