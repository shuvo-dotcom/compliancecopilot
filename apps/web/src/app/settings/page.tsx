'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLLMKey } from '@/store/llmKey'

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (Anthropic)' },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7 (Anthropic)' },
  { id: 'gemini/gemini-1.5-flash', label: 'Gemini 1.5 Flash (Google)' },
  { id: 'gemini/gemini-1.5-pro', label: 'Gemini 1.5 Pro (Google)' },
  { id: 'gemini/gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google)' },
  { id: 'ollama/llama3', label: 'Llama 3 (Ollama — local)' },
  { id: 'groq/llama3-8b-8192', label: 'Llama 3 8B (Groq)' },
  { id: 'mistral/mistral-large-latest', label: 'Mistral Large' },
]

export default function SettingsPage() {
  const { apiKey, model, setKey, clearKey, isConfigured } = useLLMKey()
  const [inputKey, setInputKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(model)
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!inputKey.trim()) return
    setKey(inputKey.trim(), selectedModel)
    setInputKey('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Dashboard</Link>
        <h1 className="text-base font-semibold text-gray-900">Settings</h1>
        <div />
      </nav>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">LLM API Key</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your key is stored only in browser memory and is never sent to our servers.
            It will be cleared when you close this tab.
          </p>

          {isConfigured() && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 font-medium">Key configured · Model: {model}</span>
              </div>
              <button onClick={clearKey} className="text-xs text-red-600 hover:text-red-800">Clear</button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="sk-... or key-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
                <option value="custom">Custom model ID…</option>
              </select>
            </div>

            {saved && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                Key saved for this session.
              </div>
            )}

            <button
              type="submit"
              disabled={!inputKey.trim()}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Key
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Supported Providers</h2>
          <div className="grid grid-cols-2 gap-2">
            {['OpenAI', 'Anthropic', 'Google Gemini', 'Ollama (local)', 'Groq', 'Mistral', 'Azure OpenAI', 'AWS Bedrock'].map(p => (
              <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                {p}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Powered by LiteLLM — supports 100+ providers.</p>
        </div>
      </main>
    </div>
  )
}
