'use client'

import { ParameterRequirement } from '@/types'
import { CheckCircle, List } from 'lucide-react'

interface RequirementsListProps {
  requirements: ParameterRequirement[]
  loaded: boolean
}

export default function RequirementsList({ requirements, loaded }: RequirementsListProps) {
  if (!loaded) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2 text-emerald-400 mb-3">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Załadowano {requirements.length} wymagań</span>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <List className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-gray-300">{req.nazwa}</span>
              <span className="text-gray-500 mx-2">→</span>
              <span className="text-gray-400">{req.wymaganie_minimalne}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
