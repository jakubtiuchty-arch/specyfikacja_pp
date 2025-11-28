'use client'

import clsx from 'clsx'

interface ComparisonData {
  urzadzenia: string[]
  parametry: {
    parametr: string
    wymaganie_minimalne: string
    wyniki: Record<string, { wartosc: string; status: string }>
  }[]
}

interface ComparisonTableProps {
  data: ComparisonData | null
}

export default function ComparisonTable({ data }: ComparisonTableProps) {
  if (!data || data.urzadzenia.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Brak danych do porównania</p>
        <p className="text-sm mt-1">Wgraj karty katalogowe i uruchom porównanie</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left bg-teal-500/10 text-teal-400 font-medium border border-white/10">
              Parametr
            </th>
            <th className="p-3 text-left bg-teal-500/10 text-teal-400 font-medium border border-white/10">
              Wymaganie min.
            </th>
            {data.urzadzenia.map((device, i) => (
              <th
                key={i}
                className="p-3 text-left bg-teal-500/10 text-teal-400 font-medium border border-white/10 min-w-[150px]"
              >
                {device}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.parametry.map((param, i) => (
            <tr key={i}>
              <td className="p-3 border border-white/10 text-gray-300 font-medium">
                {param.parametr}
              </td>
              <td className="p-3 border border-white/10 text-gray-400">
                {param.wymaganie_minimalne}
              </td>
              {data.urzadzenia.map((device, j) => {
                const wynik = param.wyniki[device]
                return (
                  <td
                    key={j}
                    className={clsx(
                      'p-3 border border-white/10',
                      wynik?.status === 'SPEŁNIA' && 'bg-emerald-500/10',
                      wynik?.status === 'NIE SPEŁNIA' && 'bg-red-500/10',
                      wynik?.status === 'DO WERYFIKACJI' && 'bg-amber-500/10'
                    )}
                  >
                    <div className="text-gray-300">{wynik?.wartosc || '-'}</div>
                    <div
                      className={clsx(
                        'text-xs mt-1 font-medium',
                        wynik?.status === 'SPEŁNIA' && 'text-emerald-400',
                        wynik?.status === 'NIE SPEŁNIA' && 'text-red-400',
                        wynik?.status === 'DO WERYFIKACJI' && 'text-amber-400'
                      )}
                    >
                      {wynik?.status || '-'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
