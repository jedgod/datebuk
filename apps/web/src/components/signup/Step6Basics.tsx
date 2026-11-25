"use client";
import { TextField } from "@/components/ui/textfield";

interface Step6Props {
  values: any;
  errors: any;
  onChange: (field: string, value: string) => void;
}

const orientationOptions = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Prefer not to say'];
const relationshipGoals = ['Long-term relationship', 'Short-term relationship', 'Friendship', 'Not sure yet'];

export default function Step6Basics({ values, errors, onChange }: Step6Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Complete your profile</h2>
        <p className="mt-2 text-sm text-gray-600">
          Help matches get to know you better
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Sexual Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {orientationOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange('sexualOrientation', option)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  values.sexualOrientation === option
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.sexualOrientation && (
            <p className="mt-1 text-sm text-red-600">{errors.sexualOrientation}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Relationship Goal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {relationshipGoals.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onChange('relationshipGoal', goal)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  values.relationshipGoal === goal
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
          {errors.relationshipGoal && (
            <p className="mt-1 text-sm text-red-600">{errors.relationshipGoal}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Height
          </label>
          <select
            value={values.height}
            onChange={(e) => onChange('height', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium focus:border-purple-600 focus:outline-none"
          >
            <option value="">Select your height</option>
            {Array.from({ length: 30 }, (_, i) => {
              const inches = i + 54; // 4'6" to 6'11"
              const feet = Math.floor(inches / 12);
              const remainingInches = inches % 12;
              return (
                <option key={inches} value={`${feet}'${remainingInches}"`}>
                  {feet}'{remainingInches}"
                </option>
              );
            })}
          </select>
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        <div>
          <TextField
            label="Bio"
            value={values.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            placeholder="Tell us a bit about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {values.bio?.length || 0} characters (min. 20)
          </p>
        </div>
      </div>
    </div>
  );
}
