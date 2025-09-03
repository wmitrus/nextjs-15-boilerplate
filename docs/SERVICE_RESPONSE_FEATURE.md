# Service Response Feature Documentation

## Overview

The Service Response Feature provides a unified, type-safe approach to handling API responses throughout the Next.js 15 boilerplate application. It standardizes response formats, error handling, and client-server communication patterns.

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Details](#implementation-details)
3. [Usage Guide](#usage-guide)
4. [Complete Flow Examples](#complete-flow-examples)
5. [Testing](#testing)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture

### Core Components

```
src/
├── types/responseService.ts          # Response type definitions
├── lib/responseService.ts            # Core response utilities
├── guards/responseService.ts         # Type guards
├── lib/api/                         # API client layer
│   ├── client.ts                    # Base HTTP client
│   ├── auth.ts                      # Authentication API
│   ├── user.ts                      # User management API
│   ├── tenant.ts                    # Multi-tenant API
│   ├── feature-flags.ts             # Feature flags API
│   └── index.ts                     # Centralized exports
└── app/api/                         # Next.js API routes
    ├── login/route.ts               # Login endpoint
    ├── feature-flags/route.ts       # Feature flags endpoint
    └── tenants/[tenantId]/route.ts  # Tenant endpoint
```

### Response Types

All API responses follow a standardized union type:

```typescript
type ApiResponse<T> =
  | SuccessResponse<T>
  | ValidationErrorResponse
  | ServerErrorResponse
  | RedirectResponse;
```

#### Response Variants

1. **Success Response**

   ```typescript
   {
     status: 'success';
     data: T;
   }
   ```

2. **Validation Error Response**

   ```typescript
   {
     status: 'validation_error';
     errors: KnownFormErrors;
   }
   ```

3. **Server Error Response**

   ```typescript
   {
     status: 'server_error';
     error: string;
   }
   ```

4. **Redirect Response**
   ```typescript
   {
     status: 'redirect';
     redirectTo: string;
   }
   ```

## Implementation Details

### Server-Side (API Routes)

API routes use response creator functions to ensure consistent formatting:

```typescript
// src/lib/responseService.ts
export function createSuccessResponse<T>(data: T): NextResponse {
  return NextResponse.json({ status: 'success', data }, { status: 200 });
}

export function createValidationErrorResponse(
  errors: KnownFormErrors,
): NextResponse {
  return NextResponse.json(
    { status: 'validation_error', errors },
    { status: 400 },
  );
}

export function createServerErrorResponse(
  error: string,
  status = 500,
): NextResponse {
  return NextResponse.json({ status: 'server_error', error }, { status });
}

export function createRedirectResponse(redirectTo: string): NextResponse {
  return NextResponse.json({ status: 'redirect', redirectTo }, { status: 302 });
}
```

### Client-Side (API Services)

The centralized API client handles all HTTP communication:

```typescript
// src/lib/api/client.ts
class ApiClient {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      });

      return this.parseResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch {
      return {
        status: 'server_error',
        error: `Failed to parse response: ${response.status} ${response.statusText}`,
      };
    }
  }
}
```

### Response Handling

Client components use the `handleApiResponse` utility for type-safe response processing:

```typescript
// src/lib/responseService.ts
export function handleApiResponse<T>(response: ApiResponse<T>) {
  return {
    isSuccess: response.status === 'success',
    isValidationError: response.status === 'validation_error',
    isServerError: response.status === 'server_error',
    isRedirect: response.status === 'redirect',
    data: response.status === 'success' ? response.data : null,
    errors: response.status === 'validation_error' ? response.errors : null,
    error: response.status === 'server_error' ? response.error : null,
    redirectTo: response.status === 'redirect' ? response.redirectTo : null,
  };
}
```

## Usage Guide

### Creating API Routes

1. **Import response creators:**

   ```typescript
   import {
     createSuccessResponse,
     createValidationErrorResponse,
     createServerErrorResponse,
   } from '@/lib/responseService';
   ```

2. **Handle requests with proper responses:**

   ```typescript
   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();

       // Validate input
       const validationResult = schema.safeParse(body);
       if (!validationResult.success) {
         const errors = formatZodErrors(validationResult.error);
         return createValidationErrorResponse(errors);
       }

       // Process request
       const result = await processRequest(validationResult.data);

       return createSuccessResponse(result);
     } catch (error) {
       console.error('API Error:', error);
       const errorMessage =
         error instanceof Error ? error.message : String(error);
       return createServerErrorResponse(`Request failed: ${errorMessage}`);
     }
   }
   ```

### Creating API Services

1. **Define service class:**

   ```typescript
   export class UserApiService {
     constructor(private client: ApiClient) {}

     async getProfile(): Promise<ApiResponse<UserProfile>> {
       return this.client.get<UserProfile>('/api/user/profile');
     }

     async updateProfile(
       userData: UpdateUserProfileRequest,
     ): Promise<ApiResponse<UserProfile>> {
       return this.client.put<UserProfile>('/api/user/profile', userData);
     }
   }
   ```

2. **Export service instance:**
   ```typescript
   export const userApi = new UserApiService(apiClient);
   ```

### Using API Services in Components

1. **Import API service and response handler:**

   ```typescript
   import { userApi, handleApiResponse } from '@/lib/api';
   ```

2. **Make API calls with proper error handling:**

   ```typescript
   const handleSubmit = async (data: FormData) => {
     setIsLoading(true);

     try {
       const apiResponse = await userApi.updateProfile(data);
       const result = handleApiResponse(apiResponse);

       if (result.isSuccess && result.data) {
         // Handle success
         setUser(result.data);
         showSuccessMessage('Profile updated successfully');
       } else if (result.isValidationError) {
         // Handle validation errors
         const errorMessages = Object.values(result.errors || {})
           .flat()
           .join(', ');
         showErrorMessage(errorMessages);
       } else if (result.isServerError) {
         // Handle server errors
         showErrorMessage(result.error || 'Server error occurred');
       } else if (result.isRedirect) {
         // Handle redirects
         router.push(result.redirectTo);
       }
     } catch (error) {
       // Handle network errors
       console.error('Network error:', error);
       showErrorMessage('Network error. Please try again.');
     } finally {
       setIsLoading(false);
     }
   };
   ```

## Complete Flow Examples

### Example 1: User Login Flow

#### 1. API Route (`src/app/api/login/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/responseService';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      return createValidationErrorResponse(errors);
    }

    const { email, password } = validationResult.data;

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      return createValidationErrorResponse({
        credentials: ['Invalid email or password'],
      });
    }

    // Return success response
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(`Login failed: ${errorMessage}`);
  }
}
```

#### 2. API Service (`src/lib/api/auth.ts`)

```typescript
import type { ApiResponse } from '@/types/responseService';
import type { ApiClient } from './client';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthApiService {
  constructor(private client: ApiClient) {}

  async login(
    credentials: LoginFormData,
  ): Promise<ApiResponse<LoginResponseData>> {
    return this.client.post<LoginResponseData>('/api/login', credentials);
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>('/api/logout', {});
  }
}

export const authApi = new AuthApiService(apiClient);
```

#### 3. Component Usage (`src/app/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi, handleApiResponse } from '@/lib/api';
import { loginSchema, type LoginFormData } from './validation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginResponse, setLoginResponse] = useState<{
    success: boolean;
    message: string;
    user?: { id: string; email: string; name: string };
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginResponse(null);

    try {
      const apiResponse = await authApi.login(data);
      const result = handleApiResponse(apiResponse);

      if (result.isSuccess && result.data) {
        // Handle successful login
        setLoginResponse({
          success: true,
          message: 'Login successful',
          user: result.data.user,
        });

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 1500);
        reset();
      } else if (result.isValidationError) {
        // Handle validation errors
        const errorMessages = Object.values(result.errors || {})
          .flat()
          .join(', ');
        setLoginResponse({
          success: false,
          message: errorMessages || 'Validation failed',
        });
      } else if (result.isServerError) {
        // Handle server errors
        setLoginResponse({
          success: false,
          message: result.error || 'Server error occurred',
        });
      } else if (result.isRedirect) {
        // Handle redirects
        router.push(result.redirectTo);
      }
    } catch (error) {
      console.error('Login request failed:', error);
      setLoginResponse({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <input
        type="email"
        {...register('email')}
        disabled={isLoading}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        type="password"
        {...register('password')}
        disabled={isLoading}
      />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Response message */}
      {loginResponse && (
        <div className={loginResponse.success ? 'success' : 'error'}>
          <p>{loginResponse.message}</p>
          {loginResponse.success && loginResponse.user && (
            <p>Welcome, {loginResponse.user.name}!</p>
          )}
        </div>
      )}
    </form>
  );
}
```

### Example 2: Feature Flags Flow

#### 1. API Route (`src/app/api/feature-flags/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = body as FeatureFlagContext;

    // Get feature flags based on context
    const flags = await featureFlagProvider.getAllFlags(context);

    const responseData = {
      flags,
      context: {
        environment: context.environment,
        version: getEnvironmentConfig().version,
      },
    };

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('Feature flags error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(
      `Failed to load feature flags: ${errorMessage}`,
    );
  }
}
```

#### 2. API Service (`src/lib/api/feature-flags.ts`)

```typescript
export class FeatureFlagsApiService {
  async getFlags(
    context: FeatureFlagContext,
  ): Promise<ApiResponse<FeatureFlagsResponseData>> {
    return this.client.post<FeatureFlagsResponseData>(
      '/api/feature-flags',
      context,
    );
  }
}
```

#### 3. Context Usage (`src/lib/feature-flags/context.tsx`)

```typescript
const loadFeatureFlags = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);

    const apiResponse = await featureFlagsApi.getFlags(context);
    const result = handleApiResponse(apiResponse);

    if (result.isSuccess && result.data) {
      setFlags(result.data.flags);
    } else if (result.isServerError) {
      throw new Error(result.error || 'Server error occurred');
    } else {
      throw new Error('Unknown error occurred');
    }
  } catch (error) {
    console.error('Failed to load feature flags:', error);
    setError(error instanceof Error ? error : new Error(String(error)));
    // Set default flags on error
    setFlags({});
  } finally {
    setIsLoading(false);
  }
}, [context]);
```

## Testing

### Unit Testing API Services

```typescript
import { authApi } from '@/lib/api';

describe('AuthApiService', () => {
  it('should handle successful login', async () => {
    const mockResponse = {
      status: 'success' as const,
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      },
    };

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await authApi.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.user.email).toBe('test@example.com');
    }
  });
});
```

### Integration Testing with MSW

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/mocks/server';
import { createSuccessResponse, createServerErrorResponse } from '@/lib/responseService';

describe('Login Integration', () => {
  it('should handle successful login', async () => {
    server.use(
      http.post('/api/login', () => {
        const responseData = {
          user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
        };
        const successResponse = createSuccessResponse(responseData);
        return HttpResponse.json(successResponse, { status: 200 });
      })
    );

    // Test component behavior
    render(<LoginPage />);
    // ... test interactions
  });

  it('should handle API errors', async () => {
    server.use(
      http.post('/api/login', () => {
        const errorResponse = createServerErrorResponse('Internal Server Error');
        return HttpResponse.json(errorResponse, { status: 500 });
      })
    );

    // Test error handling
    render(<LoginPage />);
    // ... test error scenarios
  });
});
```

## Best Practices

### 1. Consistent Error Handling

Always use the response handler pattern:

```typescript
const result = handleApiResponse(apiResponse);

if (result.isSuccess && result.data) {
  // Handle success
} else if (result.isValidationError) {
  // Handle validation errors
} else if (result.isServerError) {
  // Handle server errors
} else if (result.isRedirect) {
  // Handle redirects
}
```

### 2. Type Safety

Always specify generic types for API responses:

```typescript
// Good
const response = await userApi.getProfile();
const result = handleApiResponse<UserProfile>(response);

// Avoid
const response = await userApi.getProfile();
const result = handleApiResponse(response); // Type inference may fail
```

### 3. Error Logging

Log errors consistently on both client and server:

```typescript
// Server-side
catch (error) {
  console.error('API Error:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return createServerErrorResponse(`Operation failed: ${errorMessage}`);
}

// Client-side
catch (error) {
  logger.error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  showErrorMessage('Network error. Please try again.');
}
```

### 4. Loading States

Always manage loading states properly:

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    // API call
  } finally {
    setIsLoading(false); // Always reset loading state
  }
};
```

### 5. Validation Error Display

Format validation errors consistently:

```typescript
if (result.isValidationError) {
  const errorMessages = Object.entries(result.errors || {})
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ');
  showErrorMessage(errorMessages);
}
```

## Troubleshooting

### Common Issues

1. **Type Errors with Response Handling**

   ```typescript
   // Problem: TypeScript can't infer the response type
   const result = handleApiResponse(response);

   // Solution: Specify the generic type
   const result = handleApiResponse<UserProfile>(response);
   ```

2. **Network Errors Not Handled**

   ```typescript
   // Problem: Only handling API response errors
   const response = await userApi.getProfile();
   const result = handleApiResponse(response);

   // Solution: Wrap in try-catch for network errors
   try {
     const response = await userApi.getProfile();
     const result = handleApiResponse(response);
   } catch (error) {
     // Handle network errors
   }
   ```

3. **Inconsistent Error Messages**

   ```typescript
   // Problem: Different error message formats
   return createServerErrorResponse(error.message);

   // Solution: Consistent error formatting
   const errorMessage = error instanceof Error ? error.message : String(error);
   return createServerErrorResponse(`Operation failed: ${errorMessage}`);
   ```

4. **Missing Loading States**

   ```typescript
   // Problem: No loading indication
   const handleSubmit = async () => {
     const response = await api.submit(data);
   };

   // Solution: Proper loading state management
   const handleSubmit = async () => {
     setIsLoading(true);
     try {
       const response = await api.submit(data);
     } finally {
       setIsLoading(false);
     }
   };
   ```

### Debugging Tips

1. **Enable API Logging**

   ```typescript
   // In development, log all API responses
   if (process.env.NODE_ENV === 'development') {
     console.log('API Response:', response);
   }
   ```

2. **Check Network Tab**
   - Verify request/response format in browser dev tools
   - Ensure response status codes match expected values

3. **Validate Response Structure**

   ```typescript
   // Add runtime validation for debugging
   if (!response || typeof response.status !== 'string') {
     console.error('Invalid response structure:', response);
   }
   ```

4. **Test with MSW**
   - Use MSW handlers to simulate different response scenarios
   - Test error conditions and edge cases

## Migration Guide

### From Direct Fetch Calls

**Before:**

```typescript
const response = await fetch('/api/user');
const data = await response.json();
if (response.ok) {
  setUser(data);
} else {
  setError(data.message);
}
```

**After:**

```typescript
const apiResponse = await userApi.getProfile();
const result = handleApiResponse(apiResponse);

if (result.isSuccess && result.data) {
  setUser(result.data);
} else if (result.isServerError) {
  setError(result.error);
}
```

### From Custom Response Handling

**Before:**

```typescript
// Custom response format
return NextResponse.json({ success: true, user: userData });
return NextResponse.json({ success: false, error: 'User not found' });
```

**After:**

```typescript
// Standardized response format
return createSuccessResponse({ user: userData });
return createServerErrorResponse('User not found');
```

This documentation provides a comprehensive guide to implementing and using the Service Response Feature. The standardized approach ensures consistency, type safety, and maintainability across the entire application.
