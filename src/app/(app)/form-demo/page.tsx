'use client';

import { z } from 'zod';

import { useZodForm } from '@/lib/forms';

// Demo schema for testing
const demoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to terms'),
});

type DemoFormData = z.infer<typeof demoSchema>;

export default function FormDemoPage() {
  const { fields, handleSubmit, isSubmitting } = useZodForm<DemoFormData>({
    schema: demoSchema,
    onSubmit: async (data: DemoFormData) => {
      console.log('Form submitted:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Form submitted successfully!');
    },
    config: {
      fields: {
        firstName: {
          label: 'First Name',
          placeholder: 'Enter your first name',
        },
        lastName: {
          label: 'Last Name',
          placeholder: 'Enter your last name',
        },
        email: {
          label: 'Email Address',
          placeholder: 'Enter your email',
        },
        age: {
          label: 'Age',
          placeholder: 'Enter your age',
          type: 'number',
        },
        agreeToTerms: {
          label: 'I agree to the terms and conditions',
          type: 'checkbox',
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Form Demo</h1>
          <p className="text-gray-600">Testing the Zod Form Library</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.firstName}
            {fields.lastName}
            {fields.email}
            {fields.age}
            {fields.agreeToTerms}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <a href="/login" className="text-indigo-600 hover:text-indigo-500">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
