"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import Step1Account from "./Step1Account";
import Step2AgeName from "./Step2AgeName";
import Step3GenderSeeking from "./Step3GenderSeeking";
import Step4Location from "./Step4Location";
import Step5ProfilePhoto from "./Step5ProfilePhoto";
import Step6Basics from "./Step6Basics";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";
import { heightToCm, toGender, toSeeking, uploadSignupPhotos } from "@/lib/signup-profile";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

interface SignUpValues {
  emailOrPhone: string;
  password: string;
  age: string;
  name: string;
  gender: string;
  seeking: string[];
  location: { city: string; lat?: number; lng?: number };
  photos: string[];
  sexualOrientation: string;
  relationshipGoal: string;
  height: string;
  bio: string;
}

const initialValues: SignUpValues = {
  emailOrPhone: '',
  password: '',
  age: '',
  name: '',
  gender: '',
  seeking: [],
  location: { city: '' },
  photos: [],
  sexualOrientation: '',
  relationshipGoal: '',
  height: '',
  bio: '',
};

export default function SignUpFlow() {
  const router = useRouter();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<SignUpValues>(initialValues);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    Step1Account,
    Step2AgeName,
    Step3GenderSeeking,
    Step4Location,
    Step5ProfilePhoto,
    Step6Basics,
  ];

  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep];

  const handleChange = (field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: any = {};

    switch (currentStep) {
      case 0: // Step 1
        if (!values.emailOrPhone) newErrors.emailOrPhone = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(values.emailOrPhone)) newErrors.emailOrPhone = 'Invalid email';
        if (!values.password) newErrors.password = 'Password is required';
        else if (values.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        break;

      case 1: // Step 2
        if (!values.name) newErrors.name = 'Name is required';
        else if (values.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
        if (!values.age) newErrors.age = 'Age is required';
        else if (parseInt(values.age) < 18) newErrors.age = 'You must be 18 or older';
        break;

      case 2: // Step 3
        if (!values.gender) newErrors.gender = 'Please select your gender';
        if (values.seeking.length === 0) newErrors.seeking = 'Please select at least one option';
        break;

      case 3: // Step 4
        if (!values.location.city) newErrors.location = 'Location is required';
        break;

      case 4: // Step 5
        if (!values.photos || values.photos.length < 1) newErrors.photos = 'At least 1 photo is required';
        break;

      case 5: // Step 6
        if (!values.sexualOrientation) newErrors.sexualOrientation = 'Please select your orientation';
        if (!values.relationshipGoal) newErrors.relationshipGoal = 'Please select your relationship goal';
        if (!values.height) newErrors.height = 'Please select your height';
        if (!values.bio) newErrors.bio = 'Bio is required';
        else if (values.bio.length < 20) newErrors.bio = 'Bio must be at least 20 characters';
        if (values.photos.length < 1) newErrors.photos = 'At least 1 photo is required';
        // Note: 4-6 photos are recommended but not required
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      console.log('Validation failed for step', currentStep);
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final step - submit
      setIsSubmitting(true);
      try {
        console.log('Submitting signup with email:', values.emailOrPhone);
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        
        // Create account with basic info
        const result = await signup(values.emailOrPhone, values.password, values.name);
        console.log('Signup result:', result);
        
        console.log('Signup successful, setting cookie and redirecting...');
        // Get the access token and set cookie
        const { accessToken } = useAuth.getState();
        console.log('Access token available:', !!accessToken);
        if (accessToken) {
          setCookie("dp_access", accessToken);
        }
        
        // Save the profile collected during signup. Best-effort: the account already exists,
        // so a failure here must not block onboarding (the user can finish it in Settings).
        if (accessToken) {
          try {
            const age = parseInt(values.age, 10);
            const { keys: photoKeys, failed: photosFailed } = await uploadSignupPhotos(values.photos, accessToken);
            if (photosFailed > 0) console.warn(`${photosFailed} signup photo(s) could not be uploaded`);
            await api.patch(
              '/profiles/me',
              {
                displayName: values.name || undefined,
                age: Number.isInteger(age) ? age : undefined,
                bio: values.bio || undefined,
                location: values.location?.city ? values.location : undefined,
                gender: toGender(values.gender),
                seeking: toSeeking(values.seeking),
                sexualOrientation: values.sexualOrientation || undefined,
                relationshipGoal: values.relationshipGoal || undefined,
                heightCm: heightToCm(values.height),
                photos: photoKeys.length > 0 ? photoKeys : undefined,
              },
              accessToken,
            );
          } catch (profileErr) {
            console.warn('Profile details were not saved during signup:', profileErr);
          }
        }

        // Next: confirm identity (text a link to the user's phone to scan their ID + selfie).
        router.push('/verify-identity');
      } catch (err: any) {
        console.error('Signup error:', err);
        console.error('Error name:', err?.name);
        console.error('Error message:', err?.message);
        console.error('Error stack:', err?.stack);
        
        let errorMessage = 'Failed to create account';
        
        if (err?.message?.includes('NetworkError') || err?.message?.includes('fetch')) {
          errorMessage = `Network Error: Unable to connect to the API. Make sure the backend server is running on port 4000. Details: ${err?.message}`;
        } else if (err?.status === 409) {
          errorMessage = 'This email is already in use. Please try a different email.';
        } else if (err?.status === 400) {
          errorMessage = `Invalid request: ${err?.message || 'Please check your information and try again.'}`;
        } else if (err?.status >= 500) {
          errorMessage = `Server Error: ${err?.message || 'The server encountered an error. Please try again later.'}`;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        setErrors({ submit: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/login');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return values.emailOrPhone && values.password && values.password.length >= 8;
      case 1:
        return values.name && values.age && parseInt(values.age) >= 18;
      case 2:
        return values.gender && values.seeking.length > 0;
      case 3:
        return values.location.city;
      case 4:
        return values.photos.length >= 1;
      case 5:
        // Final step requires all fields to be complete
        return (
          values.sexualOrientation && 
          values.relationshipGoal && 
          values.height && 
          values.bio.length >= 20 &&
          values.photos.length >= 1
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressBar current={currentStep + 1} total={totalSteps} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <CurrentStepComponent
            values={values}
            errors={errors}
            onChange={handleChange}
          />

          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-semibold text-red-800">Error:</p>
              <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap break-words">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:border-gray-300 transition-all"
          >
            {currentStep === 0 ? 'Sign in instead' : 'Back'}
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            title={!canProceed() ? 'Please complete all required fields' : ''}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Creating account...'
              : currentStep === totalSteps - 1
              ? '🎉 Finish & Start Matching'
              : 'Next'}
          </button>
        </div>
        
        {currentStep === totalSteps - 1 && !canProceed() && (
          <div className="mt-3 max-w-2xl mx-auto p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="font-semibold">Complete your profile to continue:</p>
            <ul className="mt-1 text-xs space-y-1">
              {!values.sexualOrientation && <li>✗ Sexual orientation required</li>}
              {!values.relationshipGoal && <li>✗ Relationship goal required</li>}
              {!values.height && <li>✗ Height required</li>}
              {values.bio.length < 20 && <li>✗ Bio must be at least 20 characters ({values.bio.length}/20)</li>}
              {values.photos.length < 1 && <li>✗ At least 1 photo required</li>}
              {values.photos.length < 4 && values.photos.length >= 1 && <li>💡 Adding 4-6 photos increases matches by 3x</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
