'use client'

import { useState } from 'react'
import { FileText, Trash2, Search, Loader2 } from 'lucide-react'
import { UploadedFile } from '@/types'

interface DeviceListProps {
  devices: UploadedFile[]
  onAnalyze: (deviceId: string) => void
  onDelete: (deviceId: string) => void
  isAnalyzing?: string | null
}

export default function DeviceList({
  devices,
  onAnalyze,
  onDelete,
  isAnalyzing
}: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Brak wgranych kart katalogowych</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-teal-500" />
            <span className="text-gray-300">{device.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAnalyze(device.id)}
              disabled={isAnalyzing === device.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors disabled:opacity-50"
            >
              {isAnalyzing === device.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="text-sm">Analizuj</span>
            </button>

            <button
              onClick={() => onDelete(device.id)}
              className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
