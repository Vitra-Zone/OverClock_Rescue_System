import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, UserRound, UsersRound } from 'lucide-react';

export function SiteChooserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="card p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-crisis-primary/14 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-500/12 blur-3xl" />
          </div>
          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-crisis-border bg-crisis-bg/80 px-3 py-1.5 text-xs text-crisis-text-dim">
              <Shield size={14} className="text-crisis-primary" /> Choose your site
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-crisis-text">
              Rescue OverClock
            </h1>
            <p className="max-w-2xl text-crisis-text-dim text-base sm:text-lg">
              Tourist and management now start from separate entry points. Pick the site you want to use and stay inside that experience.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate('/tourist-home')}
            className="card p-8 sm:p-10 text-left relative overflow-hidden group min-h-[280px] hover:border-crisis-primary/40 transition-all"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_40%)]" />
            <div className="relative h-full flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                  <UserRound size={26} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80 mb-2">Tourist site</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-crisis-text">Guest access, SOS, offline help</h2>
                  <p className="mt-4 text-crisis-text-dim text-base sm:text-lg max-w-xl">
                    Use the tourist flow for login, registration, SOS submission, live guidance, and post-SOS follow-up.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                Enter tourist site <ArrowRight size={18} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/management')}
            className="card p-8 sm:p-10 text-left relative overflow-hidden group min-h-[280px] hover:border-crisis-primary/40 transition-all"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.16),transparent_40%)]" />
            <div className="relative h-full flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center">
                  <UsersRound size={26} className="text-orange-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-orange-300/80 mb-2">Management site</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-crisis-text">Hotel, fire, medical, police operations</h2>
                  <p className="mt-4 text-crisis-text-dim text-base sm:text-lg max-w-xl">
                    Use the management flow for role login, command center actions, dispatch, and incident control.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-orange-300 font-semibold text-sm">
                Enter management site <ArrowRight size={18} />
              </div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}