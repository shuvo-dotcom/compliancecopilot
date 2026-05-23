'use client'

import { useState } from 'react'
import { apiUpload } from '@/lib/api'
import { useLLMKey } from '@/store/llmKey'

const FRAMEWORKS = [
  { id: 'gdpr', label: 'GDPR (EU 2016/679)' },
  { id: 'eu_ai_act', label: 'EU AI Act (2024)' },
]

export default function JobSubmit({ onJobCreated }: { onJobCreated: () => void }) {
  const { isConfigured } = useLLMKey()
  const [file, setFile] = useState<File | null>(null)
  const [framework, setFramework] = useState('gdpr')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('framework', framework)
      await apiUpload('/jobs/', fd)
      setFile(null)
      onJobCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">New Compliance Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
          <select
            value={framework}
            onChange={e => setFramework(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {FRAMEWORKS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Policy Document</label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="text-sm text-gray-700 font-medium px-2 text-center">{file.name}</span>
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm text-gray-500">PDF, DOCX, or TXT</span>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
        )}

        <button
          type="submit"
          disabled={!file || loading || !isConfigured()}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Submitting…' : 'Run Analysis'}
        </button>
      </form>
    </div>
  )
}
