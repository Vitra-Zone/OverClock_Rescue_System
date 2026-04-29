import { useEffect, useMemo, useState } from 'react';
import { INDIA_STATES, getIndiaDistricts } from '../data/indiaLocations';
import type { TouristProfile } from '@overclock/shared/types';

export interface TouristProfileFormValues {
  touristFirstName: string;
  touristLastName: string;
  email: string;
  phoneNumber: string;
  aadhaarNumber: string;
  homeState: string;
  homeDistrict: string;
  pinCode: string;
  password?: string;
}

interface Props {
  initialValues?: Partial<TouristProfileFormValues>;
  mode: 'register' | 'edit';
  onSubmit: (values: TouristProfileFormValues) => Promise<void> | void;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  profile?: TouristProfile | null;
}

const DEFAULT_VALUES: TouristProfileFormValues = {
  touristFirstName: '',
  touristLastName: '',
  email: '',
  phoneNumber: '',
  aadhaarNumber: '',
  homeState: '',
  homeDistrict: '',
  pinCode: '',
  password: '',
};

export function TouristProfileForm({ initialValues, mode, onSubmit, submitLabel, busy = false, error, profile }: Props) {
  const [values, setValues] = useState<TouristProfileFormValues>({ ...DEFAULT_VALUES, ...initialValues });

  useEffect(() => {
    setValues((current) => ({ ...current, ...initialValues }));
  }, [initialValues]);

  const districts = useMemo(() => getIndiaDistricts(values.homeState), [values.homeState]);

  useEffect(() => {
    if (values.homeDistrict && !districts.includes(values.homeDistrict)) {
      setValues((current) => ({ ...current, homeDistrict: '' }));
    }
  }, [districts, values.homeDistrict]);

  const update = (key: keyof TouristProfileFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ ...values, phoneNumber: values.phoneNumber.replace(/^\+91\s*/, '') });
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Tourist first name</span>
          <input className="form-input w-full" value={values.touristFirstName} onChange={(e) => update('touristFirstName', e.target.value)} required />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Tourist last name</span>
          <input className="form-input w-full" value={values.touristLastName} onChange={(e) => update('touristLastName', e.target.value)} required />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</span>
        <input type="email" className="form-input w-full" value={values.email} onChange={(e) => update('email', e.target.value)} required />
      </label>

      <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</span>
          <div className="form-input w-16 text-center text-slate-500">+91</div>
        </div>
        <label className="space-y-2 block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Mobile number</span>
          <input inputMode="numeric" className="form-input w-full" value={values.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="9876543210" required />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Aadhaar number</span>
        <input inputMode="numeric" className="form-input w-full" value={values.aadhaarNumber} onChange={(e) => update('aadhaarNumber', e.target.value)} required />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-2 block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Home state</span>
          <select className="form-input w-full" value={values.homeState} onChange={(e) => update('homeState', e.target.value)} required>
            <option value="">Select state</option>
            {INDIA_STATES.map((state) => (
              <option key={state.code} value={state.name}>{state.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Home district</span>
          <select className="form-input w-full" value={values.homeDistrict} onChange={(e) => update('homeDistrict', e.target.value)} disabled={!values.homeState} required>
            <option value="">Select district</option>
            {districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Pin code</span>
        <input inputMode="numeric" className="form-input w-full" value={values.pinCode} onChange={(e) => update('pinCode', e.target.value)} required />
      </label>

      {mode === 'register' && (
        <label className="space-y-2 block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Password</span>
          <input type="password" className="form-input w-full" value={values.password ?? ''} onChange={(e) => update('password', e.target.value)} required minLength={6} />
        </label>
      )}

      {profile && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400 space-y-1">
          <p><span className="text-white">Digital ID:</span> {profile.digitalId}</p>
          <p><span className="text-white">Serial:</span> {String(profile.serialNumber).padStart(2, '0')}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
