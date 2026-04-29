import { EMERGENCY_GUIDES } from '../data/emergencyGuides';

export function OfflineGuidancePage() {
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-black text-white">Offline Guidance</h1>
        <p className="text-slate-400">These steps are stored locally and work when the network is down.</p>
        <div className="grid gap-4">
          {EMERGENCY_GUIDES.map((guide) => (
            <section key={guide.id} className={`rounded-3xl border ${guide.borderColor} bg-slate-900 p-5`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{guide.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-white">{guide.title}</h2>
                  <p className="text-sm text-slate-400">{guide.contact}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300 list-disc pl-5">
                {guide.steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
