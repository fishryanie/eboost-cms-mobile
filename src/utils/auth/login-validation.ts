import { z } from 'zod';

export type LoginFieldErrors = Partial<Record<'password' | 'username', string>>;

export type LoginFormValues = {
  password: string;
  username: string;
};

type LoginParseResult =
  | {
      data: LoginFormValues;
      fieldErrors: LoginFieldErrors;
      success: true;
    }
  | {
      fieldErrors: LoginFieldErrors;
      success: false;
    };

const loginSchema = z.object({
  password: z.string().min(1, 'Enter your password.'),
  username: z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.'),
});

export function parseLoginForm(values: LoginFormValues): LoginParseResult {
  const result = loginSchema.safeParse(values);

  if (result.success) {
    return {
      data: result.data,
      fieldErrors: {},
      success: true,
    };
  }

  const fieldErrors: LoginFieldErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if ((field === 'password' || field === 'username') && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    fieldErrors,
    success: false,
  };
}
