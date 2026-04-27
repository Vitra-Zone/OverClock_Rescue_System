import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { TouristProfileForm } from '../components/TouristProfileForm';
import { updateTouristProfile } from '../api/client';
import type { TouristProfileFormValues } from '../components/TouristProfileForm';

export function TouristProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useTouristAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: TouristProfileFormValues) => {
    setBusy(true);
    setError(null);
    try {
      await updateTouristProfile({
        email: values.email,
        touristFirstName: values.touristFirstName,
        touristLastName: values.touristLastName,
        phoneNumber: values.phoneNumber,
        aadhaarNumber: values.aadhaarNumber,
        homeState: values.homeState,
        homeDistrict: values.homeDistrict,
        pinCode: values.pinCode,
      });
      await refreshProfile();
      navigate('/tourist');
    } catch {
      setError('Could not update profile right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="btn-ghost inline-flex items-center gap-1 text-sm -ml-2">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Profile editor</p>
            <h1 className="text-3xl font-black text-crisis-text">Edit tourist profile</h1>
          </div>

          <TouristProfileForm
            mode="edit"
            profile={profile}
            initialValues={profile ? {
              touristFirstName: profile.touristFirstName,
              touristLastName: profile.touristLastName,
              email: profile.email,
              phoneNumber: profile.phoneNumber,
              aadhaarNumber: profile.aadhaarNumber,
              homeState: profile.homeState,
              homeDistrict: profile.homeDistrict,
              pinCode: profile.pinCode,
            } : undefined}
            onSubmit={handleSubmit}
            submitLabel="Save profile"
            busy={busy}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
