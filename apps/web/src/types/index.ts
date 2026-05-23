export type JobStatus =
  | 'queued'
  | 'running'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'failed'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type RemediationPriority = 'immediate' | 'high' | 'medium' | 'low'
export type FindingStatus = 'compliant' | 'partial' | 'gap'

export interface CheckResult {
  check: string
  status: 'compliant' | 'partial' | 'missing'
  explanation: string
  evidence?: string
}

export interface Citation {
  check: string
  citation: string | null
  page_hint: string
}

export interface Finding {
  requirement_id: string
  article: string
  title: string
  severity: Severity
  overall_status: FindingStatus
  check_results: CheckResult[]
  summary: string
  citations?: Citation[]
  risk_score: number
  missing_checks: number
  partial_checks: number
  remediation_priority: RemediationPriority
}

export interface ReportSummary {
  total_requirements: number
  compliant: number
  partial: number
  gaps: number
  average_risk_score: number
  compliance_percentage: number
}

export interface Report {
  job_id: string
  framework: string
  generated_at: string
  summary: ReportSummary
  executive_summary: string
  findings: Finding[]
}

export interface Job {
  id: string
  document_name: string
  framework: string
  model: string
  status: JobStatus
  findings: Report | null
  created_at: string
  completed_at: string | null
}
