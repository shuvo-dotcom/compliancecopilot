import type { Report } from '@/types'
import FindingCard from './FindingCard'

export default function GapReport({ report }: { report: Report }) {
  const { summary } = report
  const pct = summary.compliance_percentage

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <Stat label="Compliance" value={`${pct}%`} color={pct >= 75 ? 'green' : pct >= 40 ? 'amber' : 'red'} large />
          <Stat label="Compliant" value={String(summary.compliant)} color="green" />
          <Stat label="Partial" value={String(summary.partial)} color="amber" />
          <Stat label="Gaps" value={String(summary.gaps)} color="red" />
          <Stat label="Total" value={String(summary.total_requirements)} color="gray" />
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Compliance score: fully compliant = 100%, partial = 50%, gap = 0% per requirement
        </p>
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

function Stat({ label, value, color, large }: { label: string; value: string; color: 'green' | 'amber' | 'red' | 'gray'; large?: boolean }) {
  const colors = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red:   'bg-red-50   text-red-700',
    gray:  'bg-gray-50  text-gray-600',
  }
  return (
    <div className={`rounded-lg p-3 text-center ${colors[color]}`}>
      <div className={`font-bold ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  )
}
