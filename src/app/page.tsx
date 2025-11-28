'use client'

import { useState, useEffect } from 'react'
import { Zap, BarChart3, Loader2 } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import DeviceList from '@/components/DeviceList'
import RequirementsList from '@/components/RequirementsList'
import AnalysisResults from '@/components/AnalysisResults'
import ComparisonTable from '@/components/ComparisonTable'
import { UploadedFile, ParameterRequirement, AnalysisReport } from '@/types'

export default function Home() {
  const [requirements, setRequirements] = useState<ParameterRequirement[]>([])
  const [requirementsLoaded, setRequirementsLoaded] = useState(false)
  const [devices, setDevices] = useState<UploadedFile[]>([])
  const [reports, setReports] = useState<AnalysisReport[]>([])
  const [comparison, setComparison] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'comparison'>('results')

  // Load initial data
  useEffect(() => {
    loadRequirements()
    loadDevices()
  }, [])

  const loadRequirements = async () => {
    try {
      const response = await fetch('/api/requirements')
      const data = await response.json()
      if (data.loaded) {
        setRequirements(data.parametry)
        setRequirementsLoaded(true)
      }
    } catch (error) {
      console.error('Error loading requirements:', error)
    }
  }

  const loadDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      const data = await response.json()
      setDevices(data.devices || [])
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const handleRequirementsUpload = (data: any) => {
    setRequirements(data.requirements)
    setRequirementsLoaded(true)
  }

  const handleDeviceUpload = (data: any) => {
    setDevices(prev => [...prev, {
      id: data.id,
      name: data.name,
      type: 'device',
      uploadedAt: new Date().toISOString()
    }])
  }

  const handleAnalyze = async (deviceId: string) => {
    setIsAnalyzing(deviceId)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      })
      const data = await response.json()
      if (data.success && data.report) {
        setReports(prev => {
          const filtered = prev.filter(r => r.nazwa_urzadzenia !== data.report.nazwa_urzadzenia)
          return [...filtered, data.report]
        })
        setActiveTab('results')
      }
    } catch (error) {
      console.error('Error analyzing:', error)
    } finally {
      setIsAnalyzing(null)
    }
  }

  const handleAnalyzeAll = async () => {
    setIsAnalyzing('all')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzeAll: true })
      })
      const data = await response.json()
      if (data.success && data.reports) {
        setReports(data.reports)
        setActiveTab('results')
      }
    } catch (error) {
      console.error('Error analyzing all:', error)
    } finally {
      setIsAnalyzing(null)
    }
  }

  const handleCompare = async () => {
    setIsComparing(true)
    try {
      const response = await fetch('/api/compare')
      const data = await response.json()
      if (!data.error) {
        setComparison(data)
        setActiveTab('comparison')
      }
    } catch (error) {
      console.error('Error comparing:', error)
    } finally {
      setIsComparing(false)
    }
  }

  const handleDelete = async (deviceId: string) => {
    try {
      await fetch(`/api/devices?id=${deviceId}`, { method: 'DELETE' })
      setDevices(prev => prev.filter(d => d.id !== deviceId))
      setReports(prev => prev.filter(r => !r.nazwa_urzadzenia.includes(deviceId)))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-3">
            Analizator Specyfikacji Terminali
          </h1>
          <p className="text-gray-400 text-lg">
            Automatyczna analiza zgodności z wymaganiami przetargowymi
          </p>
        </header>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Requirements upload */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400">1</span>
              Wymagania Minimalne
            </h2>
            <UploadZone
              type="requirements"
              title="Wgraj dokument przetargowy"
              description="PDF z tabelą 'Terminale mobilne' zawierającą wymagania minimalne"
              onUploadSuccess={handleRequirementsUpload}
            />
            <RequirementsList requirements={requirements} loaded={requirementsLoaded} />
          </div>

          {/* Device upload */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400">2</span>
              Karty Katalogowe
            </h2>
            <UploadZone
              type="device"
              title="Wgraj karty katalogowe"
              description="PDF z danymi technicznymi urządzeń do analizy"
              onUploadSuccess={handleDeviceUpload}
              multiple
            />
            <div className="mt-4">
              <DeviceList
                devices={devices}
                onAnalyze={handleAnalyze}
                onDelete={handleDelete}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400">3</span>
            Analiza i Porównanie
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleAnalyzeAll}
              disabled={!requirementsLoaded || devices.length === 0 || isAnalyzing === 'all'}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing === 'all' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              Analizuj wszystkie urządzenia
            </button>

            <button
              onClick={handleCompare}
              disabled={!requirementsLoaded || devices.length < 2 || isComparing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComparing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <BarChart3 className="w-5 h-5" />
              )}
              Porównaj urządzenia
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400">4</span>
              Wyniki
            </h2>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'results'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Raporty
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'comparison'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Porównanie
              </button>
            </div>
          </div>

          {activeTab === 'results' ? (
            <AnalysisResults reports={reports} />
          ) : (
            <ComparisonTable data={comparison} />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>System Analizy Specyfikacji Przetargowych v1.0</p>
        </footer>
      </div>
    </div>
  )
}
