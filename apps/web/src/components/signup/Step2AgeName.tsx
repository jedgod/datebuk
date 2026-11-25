"use client";
import { TextField } from "@/components/ui/textfield";

interface Step2Props {
  values: any;
  errors: any;
  onChange: (field: string, value: string) => void;
}

export default function Step2AgeName({ values, errors, onChange }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Nice to meet you!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Tell us your name and age
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <TextField
            label="Your Name"
            type="text"
            value={values.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="First name"
            autoComplete="given-name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <TextField
            label="Your Age"
            type="number"
            value={values.age}
            onChange={(e) => onChange('age', e.target.value)}
            placeholder="18+"
            min="18"
            max="100"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            You must be 18 or older to use DateBuk
          </p>
        </div>
      </div>
    </div>
  );
}
