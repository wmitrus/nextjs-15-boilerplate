# Security Considerations

This document outlines important security considerations for implementing feature flags and multi-tenant systems in your Next.js 15 application.

## Table of Contents

- [Feature Flag Security](#feature-flag-security)
- [Multi-Tenant Security](#multi-tenant-security)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Authentication and Authorization](#authentication-and-authorization)
- [Environment Security](#environment-security)
- [Third-Party Provider Security](#third-party-provider-security)
- [Audit and Monitoring](#audit-and-monitoring)

## Feature Flag Security

### Client-Side Exposure

Protect sensitive feature flag information from client-side exposure:

```typescript
// src/lib/feature-flags/security.ts
interface SecureFeatureFlag extends FeatureFlag {
  clientSafe?: boolean; // Whether flag can be exposed to client
  sensitive?: boolean; // Whether flag contains sensitive information
}

// Filter flags before sending to client
export function filterClientSafeFlags(
  flags: Record<string, FeatureFlag>,
): Record<string, boolean> {
  const clientFlags: Record<string, boolean> = {};

  for (const [key, flag] of Object.entries(flags)) {
    // Only expose flags marked as client-safe
    if ((flag as SecureFeatureFlag).clientSafe !== false) {
      clientFlags[key] = flag.enabled;
    }
  }

  return clientFlags;
}

// Example secure flag configuration
const SECURE_FLAGS: Record<string, SecureFeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    clientSafe: true, // Safe to expose to client
  },
  'admin-panel': {
    key: 'admin-panel',
    enabled: true,
    description: 'Admin control panel',
    clientSafe: false, // Never expose to client
    sensitive: true,
  },
  'payment-processing': {
    key: 'payment-processing',
    enabled: true,
    description: 'New payment processing system',
    clientSafe: true, // General flag is safe
    sensitive: false,
  },
};
```

### Flag Value Protection

Protect sensitive values in feature flags:

```typescript
// src/lib/feature-flags/secure-values.ts
interface SecureFeatureFlagValue {
  value: any;
  encrypted?: boolean;
  masked?: boolean;
  accessibleTo?: string[]; // Roles that can access this value
}

// Encrypt sensitive flag values
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class SecureFlagValueManager {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(encryptionKey: string) {
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');
  }

  encryptValue(value: string): {
    encrypted: string;
    authTag: string;
    iv: string;
  } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      authTag,
      iv: iv.toString('hex'),
    };
  }

  decryptValue(encryptedData: {
    encrypted: string;
    authTag: string;
    iv: string;
  }): string {
    const { encrypted, authTag, iv } = encryptedData;

    const decipher = createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Store encrypted values in flag configuration
  createSecureFlag(
    key: string,
    value: any,
    options: { encrypt?: boolean; accessibleTo?: string[] } = {},
  ): SecureFeatureFlagValue {
    if (options.encrypt && typeof value === 'string') {
      const encrypted = this.encryptValue(value);
      return {
        value: encrypted,
        encrypted: true,
        accessibleTo: options.accessibleTo,
      };
    }

    return {
      value,
      accessibleTo: options.accessibleTo,
    };
  }

  // Safely retrieve flag values based on user permissions
  getSecureValue(secureValue: SecureFeatureFlagValue, userRole?: string): any {
    // Check access permissions
    if (secureValue.accessibleTo && userRole) {
      if (!secureValue.accessibleTo.includes(userRole)) {
        return undefined; // User doesn't have access
      }
    }

    // Return decrypted value if user has access
    if (secureValue.encrypted && typeof secureValue.value === 'object') {
      try {
        return this.decryptValue(secureValue.value as any);
      } catch (error) {
        console.error('Failed to decrypt flag value:', error);
        return undefined;
      }
    }

    return secureValue.value;
  }
}

// Usage
const secureValueManager = new SecureFlagValueManager(
  process.env.ENCRYPTION_KEY!,
);

const secureFlags: Record<
  string,
  FeatureFlag & { secureValue?: SecureFeatureFlagValue }
> = {
  'api-key-feature': {
    key: 'api-key-feature',
    enabled: true,
    secureValue: secureValueManager.createSecureFlag(
      'api-key-feature',
      process.env.THIRD_PARTY_API_KEY!,
      { encrypt: true, accessibleTo: ['admin', 'system'] },
    ),
  },
};
```

## Multi-Tenant Security

### Tenant Data Isolation

Ensure proper data isolation between tenants:

```typescript
// src/lib/multi-tenant/security.ts
interface TenantSecurityConfig {
  dataIsolation: 'database' | 'schema' | 'row';
  encryptionRequired: boolean;
  auditLogging: boolean;
  maxUsers?: number;
  allowedDomains?: string[];
}

class TenantSecurityManager {
  private tenantConfigs: Map<string, TenantSecurityConfig> = new Map();

  configureTenant(tenantId: string, config: TenantSecurityConfig): void {
    this.tenantConfigs.set(tenantId, config);
  }

  validateTenantAccess(
    tenantId: string,
    userId: string,
    requestedTenantId: string,
  ): boolean {
    // Users can always access their own tenant
    if (tenantId === requestedTenantId) {
      return true;
    }

    // Check if user has cross-tenant access permissions
    return this.hasCrossTenantAccess(userId, requestedTenantId);
  }

  private hasCrossTenantAccess(userId: string, tenantId: string): boolean {
    // Implementation would check user permissions
    // This is a simplified example
    return false;
  }

  enforceDataIsolation(
    tenantId: string,
    query: string,
    params: any[],
  ): { query: string; params: any[] } {
    const config = this.tenantConfigs.get(tenantId);

    if (!config) {
      throw new Error(`No security configuration for tenant ${tenantId}`);
    }

    // Add tenant isolation to query based on configuration
    switch (config.dataIsolation) {
      case 'database':
        // Connection-level isolation - no query modification needed
        return { query, params };

      case 'schema':
        // Schema-level isolation
        const schemaQuery = query
          .replace(/FROM\s+(\w+)/gi, `FROM tenant_${tenantId}.$1`)
          .replace(/INSERT INTO\s+(\w+)/gi, `INSERT INTO tenant_${tenantId}.$1`)
          .replace(/UPDATE\s+(\w+)/gi, `UPDATE tenant_${tenantId}.$1`)
          .replace(
            /DELETE FROM\s+(\w+)/gi,
            `DELETE FROM tenant_${tenantId}.$1`,
          );
        return { query: schemaQuery, params };

      case 'row':
        // Row-level isolation
        const rowQuery = `${query} AND tenant_id = $${params.length + 1}`;
        return {
          query: rowQuery,
          params: [...params, tenantId],
        };

      default:
        return { query, params };
    }
  }

  validateTenantDomain(tenantId: string, domain: string): boolean {
    const config = this.tenantConfigs.get(tenantId);

    if (!config || !config.allowedDomains) {
      return true; // No domain restrictions
    }

    return config.allowedDomains.some(
      (allowedDomain) =>
        domain === allowedDomain || domain.endsWith('.' + allowedDomain),
    );
  }
}

// Usage
const tenantSecurityManager = new TenantSecurityManager();

// Configure security for each tenant
tenantSecurityManager.configureTenant('enterprise-corp', {
  dataIsolation: 'schema',
  encryptionRequired: true,
  auditLogging: true,
  allowedDomains: ['enterprise-corp.com', 'ecorp.com'],
});

tenantSecurityManager.configureTenant('small-business', {
  dataIsolation: 'row',
  encryptionRequired: false,
  auditLogging: false,
  maxUsers: 10,
});
```

### Tenant Context Validation

Validate tenant context in requests:

```typescript
// src/lib/multi-tenant/context-validation.ts
import { getTenantId } from './hooks';

export class TenantContextValidator {
  static async validateRequestContext(
    request: Request,
    expectedTenantId?: string,
  ): Promise<{ valid: boolean; tenantId: string | null; error?: string }> {
    try {
      // Extract tenant ID from request headers
      const headerTenantId = request.headers.get('x-tenant-id');

      // Get tenant ID from context (could be from headers, subdomain, etc.)
      const contextTenantId = await getTenantId();

      // Validate that tenant IDs match
      if (expectedTenantId && headerTenantId !== expectedTenantId) {
        return {
          valid: false,
          tenantId: headerTenantId,
          error: 'Tenant ID mismatch between header and context',
        };
      }

      // Validate that context tenant ID matches header (if both present)
      if (
        headerTenantId &&
        contextTenantId &&
        headerTenantId !== contextTenantId
      ) {
        return {
          valid: false,
          tenantId: headerTenantId,
          error: 'Tenant ID mismatch between header and resolved context',
        };
      }

      return {
        valid: true,
        tenantId: headerTenantId || contextTenantId,
      };
    } catch (error) {
      return {
        valid: false,
        tenantId: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async validateUserTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    // Implementation would check if user belongs to tenant
    // This is a simplified example
    try {
      const userTenants = await getUserTenants(userId);
      return userTenants.includes(tenantId);
    } catch (error) {
      console.error('Failed to validate user tenant access:', error);
      return false;
    }
  }
}

// Usage in API routes
export async function protectedTenantRoute(request: Request, tenantId: string) {
  // Validate tenant context
  const contextValidation = await TenantContextValidator.validateRequestContext(
    request,
    tenantId,
  );

  if (!contextValidation.valid) {
    return new Response(JSON.stringify({ error: contextValidation.error }), {
      status: 400,
    });
  }

  // Validate user access to tenant
  const userId = request.headers.get('x-user-id');
  if (userId) {
    const hasAccess = await TenantContextValidator.validateUserTenantAccess(
      userId,
      tenantId,
    );

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to tenant' }),
        { status: 403 },
      );
    }
  }

  // Proceed with route logic
  return handleRoute(request, tenantId);
}
```

## Data Protection

### Encryption at Rest

Implement encryption for sensitive data:

```typescript
// src/lib/security/encryption.ts
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

class DataEncryptionManager {
  private key: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(password: string, salt: string) {
    // Derive key from password and salt
    this.key = scryptSync(password, salt, 32);
  }

  encrypt(data: string): { encrypted: string; authTag: string; iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      authTag,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encryptedData: {
    encrypted: string;
    authTag: string;
    iv: string;
  }): string {
    const { encrypted, authTag, iv } = encryptedData;

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Field-level encryption for database records
  encryptField(fieldName: string, value: string): string {
    if (!value) return value;

    try {
      const encrypted = this.encrypt(value);
      return JSON.stringify(encrypted);
    } catch (error) {
      console.error(`Failed to encrypt field ${fieldName}:`, error);
      return value; // Return original value on failure
    }
  }

  decryptField(fieldName: string, encryptedValue: string): string {
    if (!encryptedValue) return encryptedValue;

    try {
      const encryptedData = JSON.parse(encryptedValue);
      return this.decrypt(encryptedData);
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      return encryptedValue; // Return encrypted value on failure
    }
  }
}

// Usage for tenant data encryption
const tenantEncryptionManager = new DataEncryptionManager(
  process.env.TENANT_ENCRYPTION_PASSWORD!,
  process.env.TENANT_ENCRYPTION_SALT!,
);

// Encrypt sensitive tenant data
const encryptTenantData = (tenant: Tenant): Tenant => {
  if (!tenant.settings?.security?.encryptionRequired) {
    return tenant;
  }

  return {
    ...tenant,
    settings: {
      ...tenant.settings,
      // Encrypt sensitive settings
      apiKey: tenantEncryptionManager.encryptField(
        'apiKey',
        tenant.settings.apiKey,
      ),
      secretToken: tenantEncryptionManager.encryptField(
        'secretToken',
        tenant.settings.secretToken,
      ),
    },
  };
};

// Decrypt tenant data when needed
const decryptTenantData = (tenant: Tenant): Tenant => {
  if (!tenant.settings?.security?.encryptionRequired) {
    return tenant;
  }

  return {
    ...tenant,
    settings: {
      ...tenant.settings,
      // Decrypt sensitive settings
      apiKey: tenantEncryptionManager.decryptField(
        'apiKey',
        tenant.settings.apiKey,
      ),
      secretToken: tenantEncryptionManager.decryptField(
        'secretToken',
        tenant.settings.secretToken,
      ),
    },
  };
};
```

### Data Masking

Implement data masking for sensitive information:

```typescript
// src/lib/security/data-masking.ts
interface DataMaskingRule {
  field: string;
  pattern: RegExp;
  mask: string;
  rolesExempt?: string[];
}

class DataMaskingManager {
  private rules: DataMaskingRule[] = [];

  addRule(rule: DataMaskingRule): void {
    this.rules.push(rule);
  }

  maskData<T extends Record<string, any>>(data: T, userRole?: string): T {
    const maskedData = { ...data };

    for (const rule of this.rules) {
      // Skip masking if user has exempt role
      if (rule.rolesExempt && userRole && rule.rolesExempt.includes(userRole)) {
        continue;
      }

      // Apply masking to matching fields
      if (rule.field in maskedData) {
        const value = maskedData[rule.field];
        if (typeof value === 'string') {
          maskedData[rule.field] = value.replace(rule.pattern, rule.mask);
        }
      }
    }

    return maskedData;
  }

  maskArray<T extends Record<string, any>>(
    dataArray: T[],
    userRole?: string,
  ): T[] {
    return dataArray.map((item) => this.maskData(item, userRole));
  }
}

// Usage
const dataMaskingManager = new DataMaskingManager();

// Add masking rules
dataMaskingManager.addRule({
  field: 'email',
  pattern: /(.{2}).*(@.*)/,
  mask: '$1***$2',
  rolesExempt: ['admin'],
});

dataMaskingManager.addRule({
  field: 'phoneNumber',
  pattern: /(\d{3})\d{4}(\d{4})/,
  mask: '$1****$2',
  rolesExempt: ['admin', 'support'],
});

dataMaskingManager.addRule({
  field: 'creditCard',
  pattern: /(\d{4})\d{8}(\d{4})/,
  mask: '$1********$2',
});

// Apply masking to user data
const maskUserData = (user: User, userRole?: string): User => {
  return dataMaskingManager.maskData(user, userRole);
};
```

## API Security

### Rate Limiting

Implement rate limiting for API endpoints:

```typescript
// src/lib/security/rate-limiting.ts
import { createClient } from 'redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Redis key prefix
}

class RateLimiter {
  private redisClient: ReturnType<typeof createClient>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, redisUrl: string) {
    this.config = config;
    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.connect().catch(console.error);
  }

  async isRateLimited(
    key: string,
    cost: number = 1,
  ): Promise<{ limited: boolean; remaining: number; resetTime?: number }> {
    const fullKey = `${this.config.keyPrefix || 'rate-limit'}:${key}`;

    try {
      const multi = this.redisClient.multi();

      // Increment request count
      multi.incrBy(fullKey, cost);

      // Set expiration if key is new
      multi.pttl(fullKey);

      const results = await multi.exec();

      const currentCount = results[0] as number;
      const ttl = results[1] as number;

      // If this is a new key, set expiration
      if (ttl === -1) {
        await this.redisClient.pexpire(fullKey, this.config.windowMs);
      }

      const remaining = Math.max(0, this.config.maxRequests - currentCount);

      return {
        limited: currentCount > this.config.maxRequests,
        remaining,
        resetTime:
          ttl === -1 ? Date.now() + this.config.windowMs : Date.now() + ttl,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - don't block requests on Redis errors
      return { limited: false, remaining: this.config.maxRequests };
    }
  }

  async getRateLimitHeaders(key: string): Promise<Record<string, string>> {
    const { limited, remaining, resetTime } = await this.isRateLimited(key);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
    };

    if (resetTime) {
      headers['X-RateLimit-Reset'] = Math.ceil(resetTime / 1000).toString();
    }

    if (limited) {
      headers['Retry-After'] = Math.ceil(
        (resetTime ? resetTime - Date.now() : this.config.windowMs) / 1000,
      ).toString();
    }

    return headers;
  }
}

// Usage in API routes
const rateLimiter = new RateLimiter(
  {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'api',
  },
  process.env.REDIS_URL!,
);

export async function rateLimitedRoute(request: Request) {
  const userId = request.headers.get('x-user-id') || 'anonymous';
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Create rate limit key based on user or IP
  const rateLimitKey = userId !== 'anonymous' ? `user:${userId}` : `ip:${ip}`;

  const { limited, remaining } = await rateLimiter.isRateLimited(rateLimitKey);

  if (limited) {
    const headers = await rateLimiter.getRateLimitHeaders(rateLimitKey);

    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  // Add rate limit headers to response
  const headers = await rateLimiter.getRateLimitHeaders(rateLimitKey);

  // Process the actual request
  const response = await handleRoute(request);

  // Add rate limit headers to response
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}
```

### Input Validation

Implement strict input validation:

```typescript
// src/lib/security/input-validation.ts
import { z } from 'zod';

// Define strict schemas for all inputs
const FeatureFlagKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/);
const TenantIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/);
const UserIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/);

interface ValidationOptions {
  sanitize?: boolean;
  maxLength?: number;
  allowedChars?: RegExp;
}

class InputValidator {
  static validateFeatureFlagKey(
    key: string,
    options: ValidationOptions = {},
  ): string {
    try {
      // Validate using Zod schema
      const validated = FeatureFlagKeySchema.parse(key);

      // Apply additional validation options
      if (options.maxLength && validated.length > options.maxLength) {
        throw new Error(
          `Feature flag key too long: ${validated.length} > ${options.maxLength}`,
        );
      }

      if (options.allowedChars && !options.allowedChars.test(validated)) {
        throw new Error(
          `Feature flag key contains invalid characters: ${validated}`,
        );
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid feature flag key: ${error.errors.map((e) => e.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  static validateTenantId(
    tenantId: string,
    options: ValidationOptions = {},
  ): string {
    try {
      const validated = TenantIdSchema.parse(tenantId);

      if (options.maxLength && validated.length > options.maxLength) {
        throw new Error(
          `Tenant ID too long: ${validated.length} > ${options.maxLength}`,
        );
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid tenant ID: ${error.errors.map((e) => e.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  static validateUserId(
    userId: string,
    options: ValidationOptions = {},
  ): string {
    try {
      const validated = UserIdSchema.parse(userId);

      if (options.maxLength && validated.length > options.maxLength) {
        throw new Error(
          `User ID too long: ${validated.length} > ${options.maxLength}`,
        );
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid user ID: ${error.errors.map((e) => e.message).join(', ')}`,
        );
      }
      throw error;
    }
  }

  // Sanitize user inputs to prevent XSS and injection attacks
  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize context objects
  static validateFeatureFlagContext(
    context: FeatureFlagContext,
  ): FeatureFlagContext {
    const validatedContext: FeatureFlagContext = {};

    if (context.userId) {
      validatedContext.userId = this.validateUserId(context.userId);
    }

    if (context.tenantId) {
      validatedContext.tenantId = this.validateTenantId(context.tenantId);
    }

    if (context.environment) {
      // Validate environment against allowed values
      const allowedEnvironments = [
        'development',
        'test',
        'preview',
        'production',
      ];
      if (!allowedEnvironments.includes(context.environment)) {
        throw new Error(`Invalid environment: ${context.environment}`);
      }
      validatedContext.environment = context.environment;
    }

    if (context.customProperties) {
      // Sanitize custom properties
      validatedContext.customProperties = {};
      for (const [key, value] of Object.entries(context.customProperties)) {
        // Validate property key
        const validatedKey = this.validateFeatureFlagKey(key, {
          maxLength: 50,
        });

        // Sanitize property value if it's a string
        const sanitizedValue =
          typeof value === 'string' ? this.sanitizeInput(value) : value;

        validatedContext.customProperties[validatedKey] = sanitizedValue;
      }
    }

    return validatedContext;
  }
}

// Usage
export async function secureFeatureFlagRoute(request: Request) {
  try {
    const { flagKey, context } = await request.json();

    // Validate inputs
    const validatedFlagKey = InputValidator.validateFeatureFlagKey(flagKey);
    const validatedContext = InputValidator.validateFeatureFlagContext(context);

    // Process request with validated inputs
    const result = await getFeatureFlag(validatedFlagKey, validatedContext);

    return new Response(JSON.stringify({ enabled: result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Invalid input',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
```

## Authentication and Authorization

### JWT Token Security

Secure JWT token handling:

```typescript
// src/lib/security/jwt.ts
import jwt from 'jsonwebtoken';
import { createSecretKey } from 'crypto';

interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
  expiresIn: string;
}

class JWTManager {
  private config: JWTConfig;
  private secretKey: jwt.Secret;

  constructor(config: JWTConfig) {
    this.config = config;
    this.secretKey = createSecretKey(Buffer.from(config.secret, 'hex'));
  }

  generateToken(payload: object, options: jwt.SignOptions = {}): string {
    const fullPayload = {
      ...payload,
      iss: this.config.issuer,
      aud: this.config.audience,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(fullPayload, this.secretKey, {
      expiresIn: this.config.expiresIn,
      ...options,
    });
  }

  verifyToken(token: string): {
    valid: boolean;
    payload?: any;
    error?: string;
  } {
    try {
      const payload = jwt.verify(token, this.secretKey, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as any;

      return { valid: true, payload };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      };
    }
  }

  // Refresh token implementation
  generateRefreshToken(userId: string, tenantId?: string): string {
    const payload = {
      userId,
      tenantId,
      type: 'refresh',
    };

    return this.generateToken(payload, { expiresIn: '7d' });
  }

  verifyRefreshToken(token: string): {
    valid: boolean;
    userId?: string;
    tenantId?: string;
  } {
    const verification = this.verifyToken(token);

    if (!verification.valid || !verification.payload) {
      return { valid: false };
    }

    const payload = verification.payload;

    if (payload.type !== 'refresh') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.userId,
      tenantId: payload.tenantId,
    };
  }
}

// Usage
const jwtManager = new JWTManager({
  secret: process.env.JWT_SECRET!,
  issuer: 'nextjs-boilerplate',
  audience: 'nextjs-app',
  expiresIn: '1h',
});

// Secure middleware for API routes
export async function jwtAuthMiddleware(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401 },
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const verification = jwtManager.verifyToken(token);

  if (!verification.valid) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
    });
  }

  // Add user info to request context
  (request as any).user = verification.payload;

  return null; // Continue to next handler
}
```

### Role-Based Access Control

Implement RBAC for feature flags:

```typescript
// src/lib/security/rbac.ts
interface Role {
  id: string;
  name: string;
  permissions: string[];
  inherits?: string[];
}

interface User {
  id: string;
  roles: string[];
  tenantId?: string;
}

class RBACManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  addRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  assignRole(userId: string, roleId: string): void {
    if (!this.roles.has(roleId)) {
      throw new Error(`Role ${roleId} does not exist`);
    }

    const userRoles = this.userRoles.get(userId) || [];
    if (!userRoles.includes(roleId)) {
      userRoles.push(roleId);
      this.userRoles.set(userId, userRoles);
    }
  }

  getUserPermissions(userId: string): string[] {
    const roleIds = this.userRoles.get(userId) || [];
    const permissions = new Set<string>();

    const processRole = (
      roleId: string,
      processedRoles: Set<string> = new Set(),
    ) => {
      // Prevent circular dependencies
      if (processedRoles.has(roleId)) return;
      processedRoles.add(roleId);

      const role = this.roles.get(roleId);
      if (!role) return;

      // Add direct permissions
      role.permissions.forEach((permission) => permissions.add(permission));

      // Process inherited roles
      if (role.inherits) {
        role.inherits.forEach((inheritedRoleId) =>
          processRole(inheritedRoleId, new Set(processedRoles)),
        );
      }
    };

    roleIds.forEach((roleId) => processRole(roleId));
    return Array.from(permissions);
  }

  hasPermission(userId: string, permission: string): boolean {
    const permissions = this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // Feature flag specific permissions
  canAccessFeatureFlag(userId: string, flagKey: string): boolean {
    // Check if user has specific permission for this flag
    const specificPermission = `feature-flag:${flagKey}`;
    if (this.hasPermission(userId, specificPermission)) {
      return true;
    }

    // Check if user has general feature flag permission
    return this.hasPermission(userId, 'feature-flag:access');
  }

  canModifyFeatureFlag(userId: string, flagKey: string): boolean {
    // Check if user has specific permission to modify this flag
    const specificPermission = `feature-flag:${flagKey}:modify`;
    if (this.hasPermission(userId, specificPermission)) {
      return true;
    }

    // Check if user has general feature flag modification permission
    return this.hasPermission(userId, 'feature-flag:modify');
  }
}

// Usage
const rbacManager = new RBACManager();

// Define roles
rbacManager.addRole({
  id: 'admin',
  name: 'Administrator',
  permissions: ['feature-flag:access', 'feature-flag:modify', 'tenant:manage'],
});

rbacManager.addRole({
  id: 'developer',
  name: 'Developer',
  permissions: ['feature-flag:access'],
  inherits: ['user'],
});

rbacManager.addRole({
  id: 'user',
  name: 'User',
  permissions: ['feature-flag:access'],
});

// Assign roles to users
rbacManager.assignRole('user-123', 'admin');
rbacManager.assignRole('user-456', 'developer');

// Secure feature flag access
export async function secureGetFeatureFlag(
  userId: string,
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  // Check if user has permission to access this feature flag
  if (!rbacManager.canAccessFeatureFlag(userId, flagKey)) {
    throw new Error('Access denied to feature flag');
  }

  return await getFeatureFlag(flagKey, context);
}
```

## Environment Security

### Secure Environment Configuration

Protect environment variables and configuration:

```typescript
// src/lib/security/env.ts
import { z } from 'zod';

// Define secure schema for environment variables
const secureEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),

  // Feature Flags
  FEATURE_FLAGS_ENABLED: z.enum(['true', 'false']).default('false'),
  FEATURE_FLAGS_PROVIDER: z
    .enum(['local', 'launchdarkly', 'growthbook', 'vercel'])
    .default('local'),
  LAUNCHDARKLY_SDK_KEY: z.string().optional(),

  // Multi-Tenant
  MULTI_TENANT_ENABLED: z.enum(['true', 'false']).default('false'),
  DEFAULT_TENANT_ID: z.string().min(1).max(50),

  // Security
  JWT_SECRET: z.string().min(32), // Require strong JWT secret
  ENCRYPTION_KEY: z.string().length(64).optional(), // 32-byte hex key
  CORS_ORIGINS: z.string().optional(),

  // API Security
  API_RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true'),
  API_RATE_LIMIT_REQUESTS: z.string().transform(Number).default('100'),

  // External Services
  REDIS_URL: z.string().url().optional(),
});

// Validate and load environment variables
export function loadSecureEnvironment() {
  try {
    const parsedEnv = secureEnvSchema.parse(process.env);

    // Additional security checks
    if (
      parsedEnv.FEATURE_FLAGS_PROVIDER !== 'local' &&
      !parsedEnv.LAUNCHDARKLY_SDK_KEY
    ) {
      throw new Error(
        'LAUNCHDARKLY_SDK_KEY is required when using LaunchDarkly provider',
      );
    }

    if (
      parsedEnv.MULTI_TENANT_ENABLED === 'true' &&
      !parsedEnv.ENCRYPTION_KEY
    ) {
      console.warn(
        'ENCRYPTION_KEY is recommended when multi-tenant is enabled',
      );
    }

    return parsedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`,
      );
    }
    throw error;
  }
}

// Secure environment access
class SecureEnvironment {
  private env: z.infer<typeof secureEnvSchema>;

  constructor() {
    this.env = loadSecureEnvironment();
  }

  // Safe access to environment variables
  get<T extends keyof z.infer<typeof secureEnvSchema>>(
    key: T,
  ): z.infer<typeof secureEnvSchema>[T] {
    return this.env[key];
  }

  // Check if feature is enabled
  isFeatureEnabled(
    feature: 'FEATURE_FLAGS' | 'MULTI_TENANT' | 'API_RATE_LIMIT',
  ): boolean {
    switch (feature) {
      case 'FEATURE_FLAGS':
        return this.env.FEATURE_FLAGS_ENABLED === 'true';
      case 'MULTI_TENANT':
        return this.env.MULTI_TENANT_ENABLED === 'true';
      case 'API_RATE_LIMIT':
        return this.env.API_RATE_LIMIT_ENABLED === 'true';
      default:
        return false;
    }
  }

  // Get public environment variables for client
  getPublicVariables(): Record<string, string> {
    return {
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: this.env.FEATURE_FLAGS_ENABLED,
      NEXT_PUBLIC_MULTI_TENANT_ENABLED: this.env.MULTI_TENANT_ENABLED,
    };
  }
}

export const secureEnv = new SecureEnvironment();
```

## Third-Party Provider Security

### Secure Provider Integration

Secure integration with third-party feature flag providers:

```typescript
// src/lib/feature-flags/secure-providers.ts
import type { FeatureFlagProvider } from './types';

// Secure wrapper for third-party providers
class SecureFeatureFlagProvider implements FeatureFlagProvider {
  private provider: FeatureFlagProvider;
  private allowedFlags: Set<string>;
  private timeout: number;

  constructor(
    provider: FeatureFlagProvider,
    allowedFlags: string[],
    timeout: number = 5000,
  ) {
    this.provider = provider;
    this.allowedFlags = new Set(allowedFlags);
    this.timeout = timeout;
  }

  async initialize(): Promise<void> {
    // Add timeout to initialization
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Provider initialization timeout')),
        this.timeout,
      );
    });

    try {
      await Promise.race([this.provider.initialize(), timeoutPromise]);
    } catch (error) {
      console.error('Provider initialization failed:', error);
      throw error;
    }
  }

  async isEnabled(
    flagKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    // Validate flag key
    if (!this.allowedFlags.has(flagKey)) {
      console.warn(`Attempt to access non-allowed flag: ${flagKey}`);
      return false;
    }

    // Add timeout to flag evaluation
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(
        () => reject(new Error('Flag evaluation timeout')),
        this.timeout,
      );
    });

    try {
      const result = await Promise.race([
        this.provider.isEnabled(flagKey, context),
        timeoutPromise,
      ]);

      return result;
    } catch (error) {
      console.error(`Flag evaluation failed for ${flagKey}:`, error);
      // Fail securely - return false on errors
      return false;
    }
  }

  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    // Validate flag key
    if (!this.allowedFlags.has(flagKey)) {
      console.warn(`Attempt to access non-allowed flag value: ${flagKey}`);
      return defaultValue;
    }

    // Add timeout to value retrieval
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error('Flag value retrieval timeout')),
        this.timeout,
      );
    });

    try {
      const result = await Promise.race([
        this.provider.getValue(flagKey, defaultValue, context),
        timeoutPromise,
      ]);

      return result;
    } catch (error) {
      console.error(`Flag value retrieval failed for ${flagKey}:`, error);
      // Return default value on errors
      return defaultValue;
    }
  }

  async getAllFlags(
    context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>> {
    // Add timeout to bulk retrieval
    const timeoutPromise = new Promise<Record<string, FeatureFlag>>(
      (_, reject) => {
        setTimeout(
          () => reject(new Error('Bulk flag retrieval timeout')),
          this.timeout,
        );
      },
    );

    try {
      const result = await Promise.race([
        this.provider.getAllFlags(context),
        timeoutPromise,
      ]);

      // Filter result to only include allowed flags
      const filteredResult: Record<string, FeatureFlag> = {};
      for (const [key, flag] of Object.entries(result)) {
        if (this.allowedFlags.has(key)) {
          filteredResult[key] = flag;
        }
      }

      return filteredResult;
    } catch (error) {
      console.error('Bulk flag retrieval failed:', error);
      // Return empty object on errors
      return {};
    }
  }

  async refresh(): Promise<void> {
    try {
      await this.provider.refresh();
    } catch (error) {
      console.error('Provider refresh failed:', error);
      throw error;
    }
  }
}

// Usage
const allowedFlags = [
  'new-dashboard',
  'dark-mode',
  'beta-feature',
  // ... other allowed flags
];

// Wrap third-party providers with security
const secureLaunchDarklyProvider = new SecureFeatureFlagProvider(
  new LaunchDarklyFeatureFlagProvider(),
  allowedFlags,
  3000, // 3 second timeout
);
```

## Audit and Monitoring

### Security Auditing

Implement security auditing for feature flag and tenant operations:

```typescript
// src/lib/security/audit.ts
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

class SecurityAuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 1000;

  log(
    userId: string | undefined,
    tenantId: string | undefined,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    success: boolean = true,
    error?: string,
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId,
      tenantId,
      action,
      resource,
      details,
      ipAddress: typeof window !== 'undefined' ? '' : '', // Would be set from request
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '', // Would be set from request
      success,
      error,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for immediate visibility
    const logMessage = `[SECURITY AUDIT] ${entry.timestamp.toISOString()} - ${action} ${resource} by ${userId || 'anonymous'}${success ? '' : ` FAILED: ${error}`}`;
    if (success) {
      console.info(logMessage);
    } else {
      console.error(logMessage);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async sendToExternalLogger(entry: AuditLogEntry): Promise<void> {
    try {
      // Send to external logging service (e.g., Splunk, ELK, etc.)
      await fetch('/api/security/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send audit log to external service:', error);
    }
  }

  // Specific audit logging for feature flags
  logFeatureFlagAccess(
    userId: string | undefined,
    tenantId: string | undefined,
    flagKey: string,
    context?: FeatureFlagContext,
    success: boolean = true,
    error?: string,
  ): void {
    this.log(
      userId,
      tenantId,
      'ACCESS_FEATURE_FLAG',
      `feature-flag:${flagKey}`,
      {
        context: context
          ? {
              userId: context.userId,
              tenantId: context.tenantId,
              environment: context.environment,
            }
          : undefined,
      },
      success,
      error,
    );
  }

  logFeatureFlagModification(
    userId: string,
    tenantId: string | undefined,
    flagKey: string,
    changes: Record<string, any>,
    success: boolean = true,
    error?: string,
  ): void {
    this.log(
      userId,
      tenantId,
      'MODIFY_FEATURE_FLAG',
      `feature-flag:${flagKey}`,
      { changes },
      success,
      error,
    );
  }

  logTenantAccess(
    userId: string | undefined,
    tenantId: string,
    success: boolean = true,
    error?: string,
  ): void {
    this.log(
      userId,
      tenantId,
      'ACCESS_TENANT',
      `tenant:${tenantId}`,
      {},
      success,
      error,
    );
  }

  // Get recent audit logs (for admin interface)
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  // Search audit logs
  searchLogs(
    filter: Partial<
      Pick<
        AuditLogEntry,
        'userId' | 'tenantId' | 'action' | 'resource' | 'success'
      >
    >,
  ): AuditLogEntry[] {
    return this.logs
      .filter((entry) => {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined && (entry as any)[key] !== value) {
            return false;
          }
        }
        return true;
      })
      .reverse();
  }
}

// Usage
export const securityAuditLogger = new SecurityAuditLogger();

// Secure feature flag hook with auditing
export async function auditedGetFeatureFlag(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  try {
    const result = await getFeatureFlag(flagKey, context);

    securityAuditLogger.logFeatureFlagAccess(
      context?.userId,
      context?.tenantId,
      flagKey,
      context,
      true,
    );

    return result;
  } catch (error) {
    securityAuditLogger.logFeatureFlagAccess(
      context?.userId,
      context?.tenantId,
      flagKey,
      context,
      false,
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw error;
  }
}
```

## Best Practices Summary

### 1. Defense in Depth

- Implement multiple layers of security controls
- Validate inputs at every boundary
- Apply principle of least privilege
- Use defense in depth for sensitive operations

### 2. Secure by Default

- Fail securely - default to denying access
- Encrypt sensitive data at rest and in transit
- Use strong authentication and authorization
- Implement proper error handling without information leakage

### 3. Monitoring and Auditing

- Log security-relevant events
- Monitor for suspicious activities
- Implement alerting for security incidents
- Regularly review audit logs

### 4. Regular Security Reviews

- Conduct regular security assessments
- Keep dependencies up to date
- Review and update security configurations
- Train developers on security best practices

### 5. Compliance Considerations

- Ensure compliance with relevant regulations (GDPR, HIPAA, etc.)
- Implement data protection measures
- Maintain audit trails for compliance
- Regular compliance assessments

By following these security considerations and implementing the provided patterns, you can build a secure feature flag and multi-tenant system that protects both your application and your users' data.
