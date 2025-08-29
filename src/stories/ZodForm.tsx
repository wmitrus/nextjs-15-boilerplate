'use client';

import { z } from 'zod';

import { useZodForm } from '@/lib/forms';

interface ZodFormProps {
  schema: z.ZodSchema;
  onSubmit?: (data: unknown) => void;
  config?: {
    fields?: Record<
      string,
      { label?: string; placeholder?: string; type?: string }
    >;
  };
  title?: string;
  description?: string;
}

export function ZodForm({
  schema,
  onSubmit = (data) => console.log('Form submitted:', data),
  config = {},
  title = 'Zod Form',
  description = 'A form powered by Zod validation',
}: ZodFormProps) {
  const { fields, handleSubmit, isSubmitting, isValid } = useZodForm({
    schema,
    onSubmit,
    config,
  });

  const schemaShape =
    (schema as { shape?: Record<string, z.ZodTypeAny> }).shape || {};
  const fieldKeys = Object.keys(schemaShape);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldKeys.map((key) => (
            <div key={key}>{fields[key]}</div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          Form is {isValid ? 'valid' : 'invalid'}
        </div>
      </div>
    </div>
  );
}
