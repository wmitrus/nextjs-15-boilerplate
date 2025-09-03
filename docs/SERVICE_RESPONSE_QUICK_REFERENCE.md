# Service Response Feature - Quick Reference

## 🚀 Quick Start Checklist

### Creating an API Route

```typescript
// 1. Import response creators
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/responseService';

// 2. Handle the request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const result = schema.safeParse(body);
    if (!result.success) {
      return createValidationErrorResponse(formatZodErrors(result.error));
    }

    // Process
    const data = await processRequest(result.data);

    // Return success
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API Error:', error);
    return createServerErrorResponse(`Request failed: ${error.message}`);
  }
}
```

### Creating an API Service

```typescript
// 1. Define service class
export class MyApiService {
  constructor(private client: ApiClient) {}

  async getData(): Promise<ApiResponse<MyData>> {
    return this.client.get<MyData>('/api/my-endpoint');
  }
}

// 2. Export instance
export const myApi = new MyApiService(apiClient);
```

### Using API Service in Component

```typescript
// 1. Import
import { myApi, handleApiResponse } from '@/lib/api';

// 2. Use in component
const handleAction = async () => {
  setIsLoading(true);

  try {
    const apiResponse = await myApi.getData();
    const result = handleApiResponse(apiResponse);

    if (result.isSuccess && result.data) {
      // Success
      setData(result.data);
    } else if (result.isValidationError) {
      // Validation errors
      showError(
        Object.values(result.errors || {})
          .flat()
          .join(', '),
      );
    } else if (result.isServerError) {
      // Server errors
      showError(result.error || 'Server error');
    }
  } catch (error) {
    // Network errors
    showError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## 📋 Response Types Reference

### Success Response

```typescript
{
  status: 'success';
  data: T;
}
```

### Validation Error Response

```typescript
{
  status: 'validation_error';
  errors: {
    [fieldName: string]: string[];
  };
}
```

### Server Error Response

```typescript
{
  status: 'server_error';
  error: string;
}
```

### Redirect Response

```typescript
{
  status: 'redirect';
  redirectTo: string;
}
```

## 🛠️ Server-Side Functions

### Response Creators

```typescript
// Success
createSuccessResponse(data);

// Validation Error
createValidationErrorResponse({
  email: ['Invalid email format'],
  password: ['Password too short'],
});

// Server Error
createServerErrorResponse('Database connection failed');

// Redirect
createRedirectResponse('/login');
```

### Zod Error Formatting

```typescript
import { formatZodErrors } from '@/lib/responseService';

const result = schema.safeParse(data);
if (!result.success) {
  return createValidationErrorResponse(formatZodErrors(result.error));
}
```

## 🎯 Client-Side Functions

### Response Handler

```typescript
const result = handleApiResponse(apiResponse);

// Type-safe checks
result.isSuccess; // boolean
result.isValidationError; // boolean
result.isServerError; // boolean
result.isRedirect; // boolean

// Type-safe data access
result.data; // T | null
result.errors; // KnownFormErrors | null
result.error; // string | null
result.redirectTo; // string | null
```

### API Client Methods

```typescript
// GET request
apiClient.get<ResponseType>('/api/endpoint');

// POST request
apiClient.post<ResponseType>('/api/endpoint', data);

// PUT request
apiClient.put<ResponseType>('/api/endpoint', data);

// DELETE request
apiClient.delete<ResponseType>('/api/endpoint');
```

## 🧪 Testing Patterns

### Unit Test API Service

```typescript
describe('MyApiService', () => {
  it('should handle success response', async () => {
    const mockResponse = {
      status: 'success' as const,
      data: { id: '1', name: 'Test' },
    };

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await myApi.getData();
    expect(result.status).toBe('success');
  });
});
```

### MSW Mock Handler

```typescript
// Success response
http.get('/api/my-endpoint', () => {
  const data = { id: '1', name: 'Test' };
  const response = createSuccessResponse(data);
  return HttpResponse.json(response, { status: 200 });
});

// Error response
http.get('/api/my-endpoint', () => {
  const response = createServerErrorResponse('Database error');
  return HttpResponse.json(response, { status: 500 });
});
```

## ⚡ Common Patterns

### Form Submission with Validation

```typescript
const onSubmit = async (formData: FormData) => {
  setIsLoading(true);
  setErrors({});

  try {
    const apiResponse = await myApi.submitForm(formData);
    const result = handleApiResponse(apiResponse);

    if (result.isSuccess) {
      showSuccess('Form submitted successfully!');
      reset();
    } else if (result.isValidationError) {
      setErrors(result.errors || {});
    } else if (result.isServerError) {
      showError(result.error || 'Submission failed');
    }
  } catch (error) {
    showError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Data Fetching with Loading State

```typescript
const [data, setData] = useState<MyData | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const apiResponse = await myApi.getData();
    const result = handleApiResponse(apiResponse);

    if (result.isSuccess && result.data) {
      setData(result.data);
    } else if (result.isServerError) {
      setError(result.error || 'Failed to load data');
    }
  } catch (error) {
    setError('Network error occurred');
  } finally {
    setIsLoading(false);
  }
}, []);
```

### Optimistic Updates

```typescript
const updateItem = async (id: string, updates: Partial<Item>) => {
  // Optimistic update
  setItems((prev) =>
    prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
  );

  try {
    const apiResponse = await myApi.updateItem(id, updates);
    const result = handleApiResponse(apiResponse);

    if (result.isSuccess && result.data) {
      // Confirm with server data
      setItems((prev) =>
        prev.map((item) => (item.id === id ? result.data! : item)),
      );
    } else {
      // Revert on error
      setItems((prev) =>
        prev.map((item) => (item.id === id ? originalItem : item)),
      );
      showError(result.error || 'Update failed');
    }
  } catch (error) {
    // Revert on network error
    setItems((prev) =>
      prev.map((item) => (item.id === id ? originalItem : item)),
    );
    showError('Network error occurred');
  }
};
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Direct response parsing

```typescript
const response = await fetch('/api/data');
const data = await response.json();
if (response.ok) {
  setData(data);
}
```

### ✅ Do: Use API service and response handler

```typescript
const apiResponse = await myApi.getData();
const result = handleApiResponse(apiResponse);
if (result.isSuccess && result.data) {
  setData(result.data);
}
```

### ❌ Don't: Inconsistent error responses

```typescript
return NextResponse.json({ error: 'Something went wrong' });
```

### ✅ Do: Use response creators

```typescript
return createServerErrorResponse('Something went wrong');
```

### ❌ Don't: Ignore network errors

```typescript
const result = handleApiResponse(await myApi.getData());
```

### ✅ Do: Handle network errors

```typescript
try {
  const apiResponse = await myApi.getData();
  const result = handleApiResponse(apiResponse);
} catch (error) {
  // Handle network errors
}
```

## 📚 File Locations

- **Types**: `src/types/responseService.ts`
- **Core Utils**: `src/lib/responseService.ts`
- **Type Guards**: `src/guards/responseService.ts`
- **API Client**: `src/lib/api/client.ts`
- **API Services**: `src/lib/api/*.ts`
- **API Routes**: `src/app/api/*/route.ts`
- **MSW Handlers**: `src/lib/mocks/handlers.ts`

## 🔗 Related Documentation

- [Full Documentation](./SERVICE_RESPONSE_FEATURE.md)
- [API Testing Guide](./TESTING_STRATEGIES.md)
- [Integration Patterns](./ADVANCED_INTEGRATION_PATTERNS.md)
