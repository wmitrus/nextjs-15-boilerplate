import { fn } from 'storybook/test';
import { z } from 'zod';

import { ZodForm } from './ZodForm';

import type { Meta, StoryObj } from '@storybook/nextjs';

// Define various Zod schemas for different form types
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to terms'),
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const surveySchema = z.object({
  satisfaction: z.enum([
    'very-satisfied',
    'satisfied',
    'neutral',
    'dissatisfied',
    'very-dissatisfied',
  ]),
  features: z.array(z.string()).min(1, 'Please select at least one feature'),
  comments: z.string().optional(),
});

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Forms/ZodForm',
  component: ZodForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A powerful form component powered by Zod validation and React Hook Form.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Form title',
    },
    description: {
      control: 'text',
      description: 'Form description',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Form submission handler',
    },
  },
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof ZodForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Login Form Story
export const LoginForm: Story = {
  args: {
    schema: loginSchema,
    title: 'Sign In',
    description: 'Please sign in to your account',
    config: {
      fields: {
        email: {
          label: 'Email Address',
          placeholder: 'Enter your email',
          type: 'email',
        },
        password: {
          label: 'Password',
          placeholder: 'Enter your password',
          type: 'password',
        },
      },
    },
  },
};

// Registration Form Story
export const RegistrationForm: Story = {
  args: {
    schema: registrationSchema,
    title: 'Create Account',
    description: 'Fill out the form to create your account',
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
          type: 'email',
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
  },
};

// Contact Form Story
export const ContactForm: Story = {
  args: {
    schema: contactSchema,
    title: 'Contact Us',
    description: "Send us a message and we'll get back to you",
    config: {
      fields: {
        name: {
          label: 'Full Name',
          placeholder: 'Enter your full name',
        },
        email: {
          label: 'Email Address',
          placeholder: 'Enter your email',
          type: 'email',
        },
        message: {
          label: 'Message',
          placeholder: 'Enter your message',
        },
      },
    },
  },
};

// Survey Form Story
export const SurveyForm: Story = {
  args: {
    schema: surveySchema,
    title: 'Customer Survey',
    description: 'Help us improve by sharing your feedback',
    config: {
      fields: {
        satisfaction: {
          label: 'How satisfied are you with our service?',
          type: 'select',
        },
        features: {
          label: 'Which features do you use most?',
          type: 'checkbox',
        },
        comments: {
          label: 'Additional Comments (Optional)',
          placeholder: 'Any additional feedback?',
        },
      },
    },
  },
};

// Minimal Form Story
export const MinimalForm: Story = {
  args: {
    schema: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Valid email required'),
    }),
    title: 'Simple Form',
    description: 'A minimal form with basic validation',
  },
};

// Form with Custom Styling
export const CustomStyledForm: Story = {
  args: {
    schema: loginSchema,
    title: 'Custom Styled Form',
    description: 'Form with custom field configurations',
    config: {
      fields: {
        email: {
          label: '📧 Email',
          placeholder: 'your.email@example.com',
        },
        password: {
          label: '🔒 Password',
          placeholder: '••••••••',
        },
      },
    },
  },
};
