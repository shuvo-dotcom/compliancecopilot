import type { Finding } from '@/types'
import CitationBadge from './CitationBadge'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_STYLES: Record<string, string> = {
  compliant: 'bg-green-50 border-green-200',
  partial: 'bg-amber-50 border-amber-200',
  gap: 'bg-red-50 border-red-200',
}

const CHECK_ICONS: Record<string, string> = {
  compliant: '✓',
  partial: '◐',
  missing: '✗',
}

const CHECK_COLORS: Record<string, string> = {
  compliant: 'text-green-600',
  partial: 'text-amber-600',
  missing: 'text-red-600',
}

export default function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className={`border rounded-xl p-5 ${STATUS_STYLES[finding.overall_status] ?? STATUS_STYLES.gap}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">{finding.article}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.medium}`}>
              {finding.severity}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{finding.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-gray-900">{finding.risk_score}</div>
          <div className="text-xs text-gray-500">risk score</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{finding.summary}</p>

      <div className="space-y-2">
        {finding.check_results.map((cr, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-start gap-2">
              <span className={`font-bold mt-0.5 shrink-0 ${CHECK_COLORS[cr.status] ?? ''}`}>
                {CHECK_ICONS[cr.status] ?? '?'}
              </span>
              <div>
                <p className="text-gray-800">{cr.check}</p>
                {cr.explanation && (
                  <p className="text-xs text-gray-500 mt-0.5">{cr.explanation}</p>
                )}
                {cr.evidence && (
                  <p className="text-xs text-gray-600 italic mt-0.5">"{cr.evidence}"</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {finding.citations && finding.citations.length > 0 && (
        <div className="mt-3 space-y-1">
          {finding.citations.map((c, i) => <CitationBadge key={i} citation={c} />)}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
        <span>Priority: <span className="font-medium text-gray-700">{finding.remediation_priority}</span></span>
        <span>{finding.missing_checks} missing · {finding.partial_checks} partial</span>
      </div>
    </div>
  )
}
