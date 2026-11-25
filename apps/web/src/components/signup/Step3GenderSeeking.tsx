"use client";

interface Step3Props {
  values: any;
  errors: any;
  onChange: (field: string, value: any) => void;
}

const genderOptions = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'];
const seekingOptions = ['Men', 'Women', 'Everyone'];

export default function Step3GenderSeeking({ values, errors, onChange }: Step3Props) {
  const toggleSeeking = (option: string) => {
    const current = values.seeking || [];
    if (current.includes(option)) {
      onChange('seeking', current.filter((s: string) => s !== option));
    } else {
      onChange('seeking', [...current, option]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">About you</h2>
        <p className="mt-2 text-sm text-gray-600">
          Help us find your perfect match
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            {genderOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange('gender', option)}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  values.gender === option
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="mt-2 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Looking for
          </label>
          <div className="grid grid-cols-3 gap-3">
            {seekingOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleSeeking(option)}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  (values.seeking || []).includes(option)
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.seeking && (
            <p className="mt-2 text-sm text-red-600">{errors.seeking}</p>
          )}
        </div>
      </div>
    </div>
  );
}
