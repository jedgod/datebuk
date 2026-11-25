"use client";
import { TextField } from "@/components/ui/textfield";

interface Step1Props {
  values: any;
  errors: any;
  onChange: (field: string, value: string) => void;
}

export default function Step1Account({ values, errors, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and create a secure password
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <TextField
            label="Email or Phone"
            type="email"
            value={values.emailOrPhone}
            onChange={(e) => onChange('emailOrPhone', e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
          />
          {errors.emailOrPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.emailOrPhone}</p>
          )}
        </div>

        <div>
          <TextField
            label="Password"
            type="password"
            value={values.password}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>
      </div>
    </div>
  );
}
