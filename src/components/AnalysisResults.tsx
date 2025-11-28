'use client'

import { AnalysisReport, ComplianceStatus } from '@/types'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface AnalysisResultsProps {
  reports: AnalysisReport[]
}

function StatusIcon({ status }: { status: ComplianceStatus }) {
  if (status === 'SPEŁNIA') {
    return <CheckCircle className="w-4 h-4 text-emerald-400" />
  }
  if (status === 'NIE SPEŁNIA') {
    return <XCircle className="w-4 h-4 text-red-400" />
  }
  return <AlertCircle className="w-4 h-4 text-amber-400" />
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span
      className={clsx(
        'status-badge inline-flex items-center gap-1',
        status === 'SPEŁNIA' && 'pass',
        status === 'NIE SPEŁNIA' && 'fail',
        status === 'DO WERYFIKACJI' && 'unknown'
      )}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  )
}

export default function AnalysisResults({ reports }: AnalysisResultsProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Brak wyników analizy</p>
        <p className="text-sm mt-1">Wgraj pliki i uruchom analizę</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reports.map((report, index) => (
        <div key={index} className="bg-white/5 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-semibold text-teal-400">
                {report.nazwa_urzadzenia}
              </h3>

              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                  SPEŁNIA: {report.podsumowanie.spelnia}
                </span>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                  NIE SPEŁNIA: {report.podsumowanie.nie_spelnia}
                </span>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  DO WERYFIKACJI: {report.podsumowanie.do_weryfikacji}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-3 font-medium">Parametr</th>
                  <th className="p-3 font-medium">Wymaganie min.</th>
                  <th className="p-3 font-medium">Wartość urządzenia</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.wyniki.map((result, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-gray-300">{result.parametr}</td>
                    <td className="p-3 text-gray-400">{result.wymaganie_minimalne}</td>
                    <td className="p-3 text-gray-300">{result.wartosc_urzadzenia}</td>
                    <td className="p-3">
                      <StatusBadge status={result.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
