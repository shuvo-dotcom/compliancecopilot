import type { Report } from '@/types'
import FindingCard from './FindingCard'

export default function GapReport({ report }: { report: Report }) {
  const { summary } = report
  const pct = summary.compliance_percentage

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat label="Compliance" value={`${pct}%`} color={pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red'} />
          <Stat label="Compliant" value={String(summary.compliant)} color="green" />
          <Stat label="Partial" value={String(summary.partial)} color="amber" />
          <Stat label="Gaps" value={String(summary.gaps)} color="red" />
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.executive_summary}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Findings ({report.findings.length})
        </h2>
        <div className="space-y-4">
          {report.findings
            .sort((a, b) => b.risk_score - a.risk_score)
            .map(f => (
              <FindingCard key={f.requirement_id} finding={f} />
            ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className={`rounded-lg p-3 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  )
}
