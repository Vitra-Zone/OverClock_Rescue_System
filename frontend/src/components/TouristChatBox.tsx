import { useState } from 'react';
import { Bot, SendHorizonal, Sparkles } from 'lucide-react';
import { askTouristAssistant } from '../api/client';
import type { TouristChatMessage, TouristChatResponse } from '../types/tourist';

interface Props {
  incidentContext?: Record<string, unknown>;
  className?: string;
}

type ChatEntry = TouristChatMessage & { actionItems?: string[] };

export function TouristChatBox({ incidentContext, className = '' }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);

    // add user message locally
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const history: TouristChatMessage[] = [...messages, { role: 'user', text: trimmed }].slice(-8).map(({ role, text }) => ({ role, text }));
      const next: TouristChatResponse = await askTouristAssistant(trimmed, incidentContext, history);

      // append assistant reply
      setMessages((m) => [...m, { role: 'assistant', text: next.reply, actionItems: next.actionItems }]);
    } catch (e) {
      setError('AI chat is unavailable right now. Please follow the emergency steps shown on this page.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`card p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-crisis-primary">
        <Bot size={18} />
        <div>
          <p className="font-semibold text-sm">Gemini emergency assistant</p>
          <p className="text-xs text-crisis-text-dim">Have a back-and-forth chat — ask follow-ups, get concise steps.</p>
        </div>
      </div>

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-crisis-border/60 bg-crisis-bg/60 p-4 text-crisis-text-dim">The assistant is ready — ask what to do next.</div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-xl ${m.role === 'user' ? 'bg-white/5 self-end text-crisis-text' : 'bg-crisis-bg/60 border border-crisis-border'} `}>
            <div className="text-sm leading-relaxed">{m.text}</div>
            {m.role === 'assistant' && m.actionItems && m.actionItems.length > 0 && (
              <div className="mt-2 space-y-2">
                {m.actionItems.map((it) => (
                  <div key={it} className="text-xs text-crisis-text-dim flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-crisis-primary" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="form-input min-h-[90px]"
        placeholder="Describe your concern..."
      />

      <button onClick={send} disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
        {loading ? <Sparkles size={16} className="animate-pulse" /> : <SendHorizonal size={16} />}
        {loading ? 'Thinking...' : 'Send'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
