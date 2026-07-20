import { z } from "zod";

/**
 * Minimum bar: 8+ characters with at least one letter and one number.
 * Deliberately not requiring symbols/mixed-case on top of that - those
 * rules are known (NIST 800-63B) to push people toward predictable
 * substitutions ("Password1!") without meaningfully raising real entropy,
 * and account lockout (src/lib/auth.ts) is the actual brute-force defense.
 */
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must include at least one letter")
  .regex(/[0-9]/, "Password must include at least one number");

/**
 * The only two roles the public registration form may ever submit - see
 * the brief's "expose Student and Business/Client only" rule. Every other
 * Role value is assigned internally, never through this schema.
 */
const publicRole = z.enum(["STUDENT", "CLIENT"]);

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    password: passwordField,
    confirmPassword: z.string(),
    role: publicRole,
    companyName: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "CLIENT" || !!data.companyName?.length, {
    message: "Company name is required",
    path: ["companyName"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
