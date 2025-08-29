import {
  FieldPath,
  FieldValues,
  UseFormReturn,
  FieldErrors,
} from 'react-hook-form';
import { z } from 'zod';

// Base field configuration
export interface BaseFieldConfig {
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
}

// Text input field config
export interface TextFieldConfig extends BaseFieldConfig {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

// Number input field config
export interface NumberFieldConfig extends BaseFieldConfig {
  min?: number;
  max?: number;
  step?: number;
}

// Select field config
export interface SelectFieldConfig extends BaseFieldConfig {
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

// Checkbox field config
export interface CheckboxFieldConfig extends BaseFieldConfig {
  checkedValue?: unknown;
  uncheckedValue?: unknown;
}

// Date field config
export interface DateFieldConfig extends BaseFieldConfig {
  min?: string;
  max?: string;
}

// Textarea field config
export interface TextareaFieldConfig extends BaseFieldConfig {
  rows?: number;
  cols?: number;
  minLength?: number;
  maxLength?: number;
}

// Union type for all field configurations
export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | DateFieldConfig
  | TextareaFieldConfig;

// Form configuration
export interface FormConfig<T extends FieldValues = FieldValues> {
  fields?: Partial<Record<FieldPath<T>, FieldConfig>>;
  formClassName?: string;
  fieldWrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  submitButtonClassName?: string;
  submitButtonText?: string;
  showSubmitButton?: boolean;
  onValidationError?: (errors: FieldErrors<T>) => void;
  onSubmitSuccess?: (data: T) => void;
  onSubmitError?: (error: Error | unknown) => void;
}

// Zod schema field metadata
export interface ZodFieldMeta {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  required: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enumValues?: string[];
  description?: string;
}

// Form hook return type
export interface UseZodFormReturn<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  fields: Record<FieldPath<T>, React.ReactElement>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: FieldErrors<T>;
  reset: () => void;
  watch: UseFormReturn<T>['watch'];
  setValue: UseFormReturn<T>['setValue'];
  getValues: UseFormReturn<T>['getValues'];
}

// Form submission handler type
export type FormSubmitHandler<T extends FieldValues = FieldValues> = (
  data: T,
  form: UseFormReturn<T>,
) => Promise<void> | void;

// Options for the useZodForm hook
export interface UseZodFormOptions<T extends FieldValues = FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: FormSubmitHandler<T>;
  config?: FormConfig<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}
