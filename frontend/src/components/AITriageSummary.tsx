import React from 'react';
import { Bot, AlertTriangle, ChevronRight, HelpCircle, User, Shield } from 'lucide-react';
import type { AITriageResult } from '../types/incident';

interface Props {
  triage: AITriageResult;
  loading?: boolean;
  onApprove?: () => void;
  onOverride?: () => void;
  humanApproved?: boolean;
}

const SEVERITY_COLORS = {
  critical: 'text-red-400 bg-red-900/30 border-red-700/50',
  high:     'text-orange-400 bg-orange-900/30 border-orange-700/50',
  medium:   'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
  low:      'text-green-400 bg-green-900/30 border-green-700/50',
};

const ACTION_LABELS: Record<string, string> = {
  dispatch_staff_and_call_helpline: 'Dispatch Staff + Call Helpline',
  dispatch_security_and_monitor:    'Dispatch Security + Monitor',
  activate_fire_alarm_and_evacuate: 'Activate Fire Alarm + Evacuate',
  initiate_evacuation_protocol:     'Initiate Evacuation Protocol',
  dispatch_nearest_staff:           'Dispatch Nearest Staff',
  request_human_approval:           'Request Human Approval',
  monitor_and_update:               'Monitor and Update',
  dispatch_and_notify:              'Dispatch and Notify',
  verify_guest_intent:              'Verify Guest Intent First',
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  medical: 'Medical',
  fire: 'Fire',
  security: 'Security',
  earthquake: 'Earthquake',
  flood: 'Flood',
  likely_fake: 'Likely Fake / Prank',
  general: 'General',
  unknown: 'Unknown',
};

const ROLE_LABELS: Record<string, string> = {
  nearest_medical_staff:  '🏥 Medical Staff',
  security_team:          '🛡️ Security Team',
  front_desk:             '🏨 Front Desk',
  fire_safety_officer:    '🔥 Fire Safety Officer',
  general_staff:          '👷 General Staff',
  emergency_services:     '🚨 Emergency Services',
  unassigned:             '⏳ Unassigned',
};

export function AITriageSummary({ triage, loading = false, onApprove, onOverride, humanApproved }: Props) {
  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-crisis-primary">
          <Bot size={18} />
          <span className="font-semibold text-sm">AI Incident Manager</span>
          <span className="text-xs text-crisis-text-dim">Analyzing...</span>
        </div>
        <div className="space-y-2">
          {[80, 60, 90, 45].map((w, i) => (
            <div key={i} className={`h-3 rounded shimmer bg-crisis-border`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const severityClass = SEVERITY_COLORS[triage.severity] ?? SEVERITY_COLORS.medium;

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-crisis-primary">
          <Bot size={18} />
          <span className="font-semibold text-sm">AI Incident Manager</span>
          {humanApproved && (
            <span className="chip bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
              <Shield size={10} /> Staff Approved
            </span>
          )}
        </div>
        <span className={`chip border ${severityClass} font-bold uppercase text-xs`}>
          {triage.severity}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-crisis-bg/60 rounded-xl p-4 border border-crisis-border/50">
        <p className="text-crisis-text text-sm leading-relaxed">{triage.summary}</p>
      </div>

      {/* Grid of info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-crisis-bg/40 rounded-lg p-3">
          <p className="text-crisis-text-dim text-xs mb-1">Incident Type</p>
          <p className="text-crisis-text font-semibold">{INCIDENT_TYPE_LABELS[triage.incidentType] ?? triage.incidentType}</p>
        </div>
        <div className="bg-crisis-bg/40 rounded-lg p-3">
          <p className="text-crisis-text-dim text-xs mb-1">Assigned To</p>
          <p className="text-crisis-text font-semibold text-sm">{ROLE_LABELS[triage.assignedTo] ?? triage.assignedTo}</p>
        </div>
      </div>

      {/* Next Action */}
      <div className="flex items-center gap-3 bg-crisis-primary/10 border border-crisis-primary/20 rounded-xl px-4 py-3">
        <ChevronRight size={16} className="text-crisis-primary shrink-0" />
        <div>
          <p className="text-crisis-text-dim text-xs">Next Recommended Action</p>
          <p className="text-crisis-primary font-semibold text-sm">
            {ACTION_LABELS[triage.nextAction] ?? triage.nextAction.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Follow-up question */}
      {triage.followUpQuestion && (
        <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-700/30 rounded-xl px-4 py-3">
          <HelpCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400/70 text-xs">AI Follow-up Question for Guest</p>
            <p className="text-blue-200 text-sm font-medium">{triage.followUpQuestion}</p>
          </div>
        </div>
      )}

      {/* Approve / Override buttons */}
      {(onApprove || onOverride) && !humanApproved && (
        <div className="flex gap-3 pt-1">
          {onApprove && (
            <button
              id="approve-triage-btn"
              onClick={onApprove}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              ✓ Approve &amp; Dispatch
            </button>
          )}
          {onOverride && (
            <button
              id="override-triage-btn"
              onClick={onOverride}
              className="btn-secondary py-2.5 px-4 text-sm"
            >
              Override
            </button>
          )}
        </div>
      )}
    </div>
  );
}
