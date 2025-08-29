'use client';

import { useMemo, useState } from 'react';
import React from 'react';

import { useForm } from 'react-hook-form';
import { z } from 'zod';

/**
 * Process form data to convert strings to appropriate types based on Zod schema
 */
function processFormData(
  data: Record<string, unknown>,
  schema: z.ZodSchema,
): Record<string, unknown> {
  const processed = { ...data };
  const schemaShape =
    (schema as { shape?: Record<string, z.ZodTypeAny> }).shape || {};

  for (const [key, fieldSchema] of Object.entries(schemaShape)) {
    const value = processed[key];

    // Convert string numbers to actual numbers for number fields
    if (fieldSchema instanceof z.ZodNumber && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        processed[key] = numValue;
      }
    }

    // Convert string booleans for boolean fields
    if (fieldSchema instanceof z.ZodBoolean && typeof value === 'string') {
      processed[key] = value === 'true' || value === 'on';
    }
  }

  return processed;
}

/**
 * Simple Zod Form Hook (Zod v4 compatible)
 * Basic working version that can be extended
 */
export function useZodForm<T = Record<string, unknown>>({
  schema,
  onSubmit,
  config = {},
}: {
  schema: z.ZodSchema;
  onSubmit: (data: T) => Promise<void> | void;
  config?: {
    fields?: Record<
      string,
      { label?: string; placeholder?: string; type?: string }
    >;
  };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create React Hook Form instance
  const form = useForm({
    mode: 'onChange',
  });

  // Handle form submission with Zod validation
  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }

    const rawData = form.getValues();

    // Convert string numbers to actual numbers for Zod validation
    const processedData = processFormData(rawData, schema);

    // Validate with Zod
    try {
      await schema.parseAsync(processedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set form errors
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            form.setError(issue.path[0] as string, { message: issue.message });
          }
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(processedData as T);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate basic field components
  const fields = useMemo(() => {
    const fieldComponents: Record<string, React.ReactElement> = {};
    const schemaShape =
      (schema as { shape?: Record<string, z.ZodTypeAny> }).shape || {};

    for (const [key] of Object.entries(schemaShape)) {
      const fieldConfig = config.fields?.[key] || {};
      const label =
        fieldConfig.label || key.charAt(0).toUpperCase() + key.slice(1);
      const placeholder =
        fieldConfig.placeholder || `Enter ${label.toLowerCase()}`;
      const inputType = fieldConfig.type || 'text';

      fieldComponents[key] = React.createElement(
        'div',
        { key, className: 'mb-4' },
        React.createElement(
          'label',
          {
            htmlFor: key,
            className: 'block text-sm font-medium text-gray-700 mb-2',
          },
          label,
          React.createElement('span', { className: 'text-red-500 ml-1' }, '*'),
        ),
        React.createElement('input', {
          id: key,
          type: inputType,
          placeholder,
          className:
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          ...form.register(key),
        }),
        form.formState.errors[key] &&
          React.createElement(
            'p',
            { className: 'mt-1 text-sm text-red-600' },
            String(form.formState.errors[key]?.message || ''),
          ),
      );
    }

    return fieldComponents;
  }, [schema, config.fields, form]);

  return {
    form,
    fields,
    handleSubmit,
    isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    reset: form.reset,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
  };
}
