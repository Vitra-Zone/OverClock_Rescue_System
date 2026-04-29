import { useState } from 'react';
import { Bot, SendHorizonal, Sparkles } from 'lucide-react';
import { askTouristAssistant } from '@overclock/shared/api';
import type { TouristChatResponse } from '@overclock/shared/types';

interface Props {
  incidentContext?: Record<string, unknown>;
  className?: string;
}

export function TouristChatBox({ incidentContext, className = '' }: Props) {
  const [message, setMessage] = useState('What should I do next?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TouristChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const next = await askTouristAssistant(message, incidentContext);
      setResult(next);
    } catch {
      setError('AI chat is unavailable right now. Please follow the emergency steps shown on this page.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`rounded-3xl border border-slate-700 bg-slate-900/80 p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-orange-400">
        <Bot size={18} />
        <div>
          <p className="font-semibold text-sm text-white">Tourist assistant</p>
          <p className="text-xs text-slate-400">Ask what to do next in plain language.</p>
        </div>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        placeholder="Describe your concern..."
      />

      <button onClick={send} disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
        {loading ? <Sparkles size={16} className="animate-pulse" /> : <SendHorizonal size={16} />}
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 space-y-3">
          <p className="text-sm text-slate-200 leading-relaxed">{result.reply}</p>
          <div className="space-y-2">
            {result.actionItems.map((item) => (
              <div key={item} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
