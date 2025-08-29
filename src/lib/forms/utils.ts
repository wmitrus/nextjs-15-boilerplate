import { z } from 'zod';

import { ZodFieldMeta } from './types';

/**
 * Extracts field metadata from a Zod schema
 */
export function extractZodFieldMeta(schema: z.ZodTypeAny): ZodFieldMeta {
  const meta: ZodFieldMeta = {
    type: 'string',
    required: !schema.isOptional(),
  };

  // Handle different Zod types
  if (schema instanceof z.ZodString) {
    meta.type = 'string';

    // Check for email validation in Zod v4
    try {
      const def = schema._def as unknown as {
        typeName?: string;
        checks?: unknown[];
      };
      if (
        def.checks?.some((check: unknown) => {
          const c = check as { kind?: string };
          return c.kind === 'email';
        })
      ) {
        meta.email = true;
      }
    } catch {
      // Ignore type errors for Zod v4 compatibility
    }
  } else if (schema instanceof z.ZodNumber) {
    meta.type = 'number';
  } else if (schema instanceof z.ZodBoolean) {
    meta.type = 'boolean';
  } else if (schema instanceof z.ZodDate) {
    meta.type = 'date';
  } else if (schema instanceof z.ZodEnum) {
    meta.type = 'enum';
    try {
      const def = schema._def as unknown as { values?: readonly string[] };
      meta.enumValues = def.values ? [...def.values] : [];
    } catch {
      // Ignore type errors for Zod v4 compatibility
    }
  } else if (schema instanceof z.ZodArray) {
    meta.type = 'array';
  } else if (schema instanceof z.ZodObject) {
    meta.type = 'object';
  }

  return meta;
}

/**
 * Extracts field metadata from a Zod object schema
 */
export function extractZodObjectFields(
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, ZodFieldMeta> {
  const fields: Record<string, ZodFieldMeta> = {};

  for (const [key, fieldSchema] of Object.entries(schema.shape)) {
    fields[key] = extractZodFieldMeta(fieldSchema as z.ZodTypeAny);
  }

  return fields;
}

/**
 * Generates a human-readable field name from a field key
 */
export function generateFieldLabel(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generates a field name/id from a field key
 */
export function generateFieldName(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Determines the appropriate input type based on field metadata
 */
export function getInputType(meta: ZodFieldMeta): string {
  if (meta.email) return 'email';
  if (meta.type === 'number') return 'number';
  if (meta.type === 'date') return 'date';
  if (meta.type === 'boolean') return 'checkbox';

  // For long text fields, we might want to use textarea
  if (meta.maxLength && meta.maxLength > 100) return 'textarea';

  return 'text';
}

/**
 * Determines if a field should be rendered as a textarea
 */
export function shouldUseTextarea(meta: ZodFieldMeta): boolean {
  return meta.type === 'string' && meta.maxLength
    ? meta.maxLength > 100
    : false;
}

/**
 * Determines if a field should be rendered as a select dropdown
 */
export function shouldUseSelect(meta: ZodFieldMeta): boolean {
  return meta.type === 'enum' && meta.enumValues
    ? meta.enumValues.length > 0
    : false;
}

/**
 * Gets default field configuration based on metadata
 */
export function getDefaultFieldConfig(meta: ZodFieldMeta, key: string) {
  const label = generateFieldLabel(key);
  const inputType = getInputType(meta);

  const config: Record<string, unknown> = {
    label,
    placeholder: `Enter ${label.toLowerCase()}`,
    type: inputType,
    required: meta.required,
  };

  // Add specific attributes based on metadata
  if (meta.minLength) config.minLength = meta.minLength;
  if (meta.maxLength) config.maxLength = meta.maxLength;
  if (meta.min !== undefined) config.min = meta.min;
  if (meta.max !== undefined) config.max = meta.max;
  if (meta.pattern) config.pattern = meta.pattern;

  return config;
}
