import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, UserPlus } from 'lucide-react';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { TouristProfileForm } from '../components/TouristProfileForm';
import type { TouristProfileFormValues } from '../components/TouristProfileForm';

function getAuthErrorMessage(error: unknown, mode: 'login' | 'register'): string {
  const fallback = mode === 'login'
    ? 'Could not sign in. Check your email and password.'
    : 'Could not register the tourist profile right now.';

  if (!error || typeof error !== 'object' || !('code' in error)) {
    return fallback;
  }

  const code = String((error as { code?: string }).code ?? '');
  const codeMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/missing-password': 'Password is required.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
    'auth/user-not-found': 'No account found for this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/operation-not-allowed': 'Email/password sign-in is disabled in Firebase Auth. Enable it in the Firebase console.',
    'auth/api-key-not-valid': 'Firebase API key is invalid for this app configuration.',
    'auth/network-request-failed': 'Network error. Check your connection and retry.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  };

  return codeMap[code] ?? fallback;
}

export function TouristHomePage() {
  const navigate = useNavigate();
  const { user, profile, loading, enabled, login, register } = useTouristAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [registerBusy, setRegisterBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      navigate('/tourist', { replace: true });
    }
  }, [navigate, profile, user]);

  if (enabled && loading) {
    return <div className="min-h-screen flex items-center justify-center text-crisis-text">Checking tourist access...</div>;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    try {
      await login(loginEmail.trim(), loginPassword);
      navigate('/tourist', { replace: true });
    } catch (error) {
      setLoginError(getAuthErrorMessage(error, 'login'));
    } finally {
      setLoginBusy(false);
    }
  };

  const handleRegister = async (values: TouristProfileFormValues) => {
    setRegisterBusy(true);
    setRegisterError(null);
    try {
      if (!values.password) {
        throw new Error('Password is required');
      }
      if (values.password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      await register({
        touristFirstName: values.touristFirstName,
        touristLastName: values.touristLastName,
        email: values.email.trim(),
        phoneNumber: values.phoneNumber,
        aadhaarNumber: values.aadhaarNumber,
        homeState: values.homeState,
        homeDistrict: values.homeDistrict,
        pinCode: values.pinCode,
        password: values.password,
      });
      navigate('/tourist', { replace: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        setRegisterError(error.message);
      } else {
        setRegisterError(getAuthErrorMessage(error, 'register'));
      }
    } finally {
      setRegisterBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="card p-7 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-crisis-primary/12 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crisis-bg/80 border border-crisis-border text-crisis-text-dim text-xs">
                <Shield size={14} className="text-crisis-primary" /> Tourist access portal
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-crisis-text">
                Login or register to continue as a tourist.
              </h1>
              <p className="text-crisis-text-dim max-w-2xl">
                Sign in with email and password, or register with your identity details so your digital card and hotel data stay connected.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto">
          <div className="card p-6 sm:p-7 space-y-5">
            <div className="inline-flex w-full rounded-xl bg-crisis-bg/70 border border-crisis-border p-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 ${
                  authMode === 'login'
                    ? 'bg-crisis-primary/20 text-crisis-primary border border-crisis-primary/35'
                    : 'text-crisis-text-dim hover:text-crisis-text'
                }`}
              >
                <LogIn size={16} /> Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 ${
                  authMode === 'register'
                    ? 'bg-crisis-primary/20 text-crisis-primary border border-crisis-primary/35'
                    : 'text-crisis-text-dim hover:text-crisis-text'
                }`}
              >
                <UserPlus size={16} /> Register
              </button>
            </div>

            {authMode === 'login' ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-crisis-text">Tourist Login</h2>
                  <p className="text-sm text-crisis-text-dim">Use your registered email and password to reopen your tourist dashboard.</p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                  <label className="space-y-2 block">
                    <span className="text-xs uppercase tracking-[0.2em] text-crisis-muted">Email</span>
                    <input type="email" className="form-input w-full" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-xs uppercase tracking-[0.2em] text-crisis-muted">Password</span>
                    <input type="password" className="form-input w-full" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </label>

                  {loginError && <p className="text-sm text-red-400">{loginError}</p>}

                  <button type="submit" disabled={loginBusy} className="btn-primary w-full">
                    {loginBusy ? 'Signing in...' : 'Login'}
                  </button>
                </form>

                <p className="text-sm text-crisis-text-dim text-center">
                  New tourist?{' '}
                  <button type="button" onClick={() => setAuthMode('register')} className="text-crisis-primary font-semibold hover:underline">
                    Create account
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-crisis-text">Tourist Registration</h2>
                  <p className="text-sm text-crisis-text-dim">Create your digital tourist profile and continue to the dashboard.</p>
                </div>

                <TouristProfileForm
                  mode="register"
                  submitLabel="Create tourist account"
                  busy={registerBusy}
                  error={registerError}
                  onSubmit={handleRegister}
                />

                <p className="text-sm text-crisis-text-dim text-center">
                  Already registered?{' '}
                  <button type="button" onClick={() => setAuthMode('login')} className="text-crisis-primary font-semibold hover:underline">
                    Login instead
                  </button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
