import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneCall, Video } from 'lucide-react';

const GUEST_SUCCESS_STORAGE_KEY = 'hackdays_guest_last_report';

interface GuidanceState {
  incidentId?: string | null;
  liveVideoUrl?: string | null;
}

export function LiveGuidancePage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const guidanceState = (state as GuidanceState | null) ?? null;

  const videoUrl = useMemo(() => {
    if (guidanceState?.liveVideoUrl) return guidanceState.liveVideoUrl;

    try {
      const raw = window.sessionStorage.getItem(GUEST_SUCCESS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { liveVideoUrl?: string | null };
      return parsed.liveVideoUrl ?? null;
    } catch {
      return null;
    }
  }, [guidanceState]);

  return (
    <div className="h-[calc(100vh-56px)] px-4 py-6 overflow-hidden flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        <section className="relative overflow-hidden card p-8 sm:p-10 lg:p-12 min-h-[560px] flex flex-col animate-fade-in">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-crisis-primary/12 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative flex-1 flex flex-col">
            <button onClick={() => navigate(-1)} className="btn-ghost inline-flex items-center gap-1 text-sm mb-6 w-fit">
              <ArrowLeft size={16} /> Back
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crisis-bg/80 border border-crisis-border text-crisis-text-dim text-xs mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-crisis-primary animate-pulse" />
                Live Guidance Session
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight text-crisis-text mb-4">
                Pick your
                <span className="gradient-text"> support mode</span>
              </h1>
              <p className="text-crisis-text-dim text-base sm:text-lg max-w-2xl mx-auto">
                Connect instantly with emergency support using voice or live video guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 flex-1">
              <div className="card border border-emerald-500/30 bg-gradient-to-b from-emerald-900/20 to-emerald-900/5 p-6 lg:p-7 flex flex-col justify-between min-h-[260px] lg:min-h-[320px] group hover:border-emerald-400/45 transition-all duration-200">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-700/20 border border-emerald-500/35 flex items-center justify-center mb-5">
                    <PhoneCall size={24} className="text-emerald-300" />
                  </div>
                  <h2 className="text-2xl font-black text-crisis-text mb-2">Voice Call</h2>
                  <p className="text-sm sm:text-base text-crisis-text-dim leading-relaxed">
                    Fast and reliable for immediate conversation with emergency support.
                  </p>
                </div>

                <a
                  id="live-guidance-voice-btn"
                  href="tel:112"
                  className="btn-secondary w-full mt-6 inline-flex items-center justify-center gap-2"
                >
                  <PhoneCall size={17} /> Start Voice Call
                </a>
              </div>

              <div className="card border border-crisis-primary/35 bg-gradient-to-b from-crisis-primary/18 to-crisis-primary/5 p-6 lg:p-7 flex flex-col justify-between min-h-[260px] lg:min-h-[320px] group hover:border-crisis-primary/55 transition-all duration-200">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-crisis-primary/20 border border-crisis-primary/35 flex items-center justify-center mb-5">
                    <Video size={24} className="text-crisis-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-crisis-text mb-2">Video Call</h2>
                  <p className="text-sm sm:text-base text-crisis-text-dim leading-relaxed">
                    Share visuals live so responders can assess the situation faster.
                  </p>
                </div>

                {videoUrl ? (
                  <a
                    id="live-guidance-video-btn"
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full mt-6 inline-flex items-center justify-center gap-2"
                  >
                    <Video size={17} /> Start Video Call
                  </a>
                ) : (
                  <button
                    id="live-guidance-video-btn"
                    onClick={() => navigate('/fallback')}
                    className="btn-primary w-full mt-6 inline-flex items-center justify-center gap-2"
                  >
                    <Video size={17} /> Start Video Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
