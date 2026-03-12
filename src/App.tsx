import { useMemo, useState } from 'react'
import { estimateFootprint, type FootprintEstimate } from './lib/footprint'

const EXAMPLES = [
  'We used 5 delivery vans and consumed 200 kWh of electricity.',
  'Consumimos 120 kWh y 35 litros de diésel.',
  '3 vans, 180 km total, y 15 L de gasolina.',
]

function formatKg(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M20 3c-6.2 0-11.2 2.4-14.7 6C1.9 12.5 2 17.6 2 21c3.4 0 8.5.1 12-3.3C17.6 14.2 20 9.2 20 3Z"
        className="fill-emerald-600"
      />
      <path
        d="M5 19c2-6 7-10 13-13"
        className="stroke-emerald-100"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function App() {
  const [text, setText] = useState(EXAMPLES[0])
  const [estimate, setEstimate] = useState<FootprintEstimate | null>(() => estimateFootprint(EXAMPLES[0]))

  const assumptions = useMemo(() => {
    const set = new Set<string>()
    for (const item of estimate?.items ?? []) for (const a of item.assumptions ?? []) set.add(a)
    return [...set]
  }, [estimate])

  const onAnalyze = () => setEstimate(estimateFootprint(text))

  return (
    <div className="min-h-full bg-emerald-50/60 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600">
              <LeafMark />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-emerald-800">EcoTrack AI</div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Huella de carbono (estimado)</h1>
            </div>
          </div>
          <div className="text-sm text-slate-600">Describe tu día y obtén kg CO₂e.</div>
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/80 p-5 ring-1 ring-emerald-900/5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-800">Texto</h2>
              <div className="hidden gap-2 sm:flex">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setText(ex)
                      setEstimate(estimateFootprint(ex))
                    }}
                    className="rounded-full px-3 py-1 text-xs font-medium text-emerald-900/80 ring-1 ring-emerald-900/10 hover:bg-emerald-50"
                  >
                    Ejemplo
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder='Ej: "Usamos 5 vans de reparto y consumimos 200 kWh de electricidad"'
                className="w-full resize-none rounded-xl bg-white p-3 text-sm text-slate-900 outline-none ring-1 ring-slate-900/10 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onAnalyze}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/30"
              >
                Analizar y estimar CO₂e
              </button>
              <div className="text-xs text-slate-500">
                Detecta: <span className="font-medium">kWh</span>, <span className="font-medium">L</span>,{' '}
                <span className="font-medium">m³</span>, <span className="font-medium">vans/km</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white/80 p-5 ring-1 ring-emerald-900/5 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-800">Resultado</h2>

            <div className="mt-3 flex items-baseline justify-between gap-3 rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-900/5">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-900/70">Total</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-semibold tracking-tight text-slate-900">{formatKg(estimate?.totalKgCO2e ?? 0)}</div>
                <div className="text-sm font-semibold text-slate-700">kg CO₂e</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(estimate?.items ?? []).map((it) => (
                <div
                  key={`${it.label}-${it.activity}`}
                  className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-900/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{it.label}</div>
                      <div className="text-xs text-slate-600">{it.activity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{formatKg(it.emissionsKgCO2e)} kg</div>
                      <div className="text-xs text-slate-500">CO₂e</div>
                    </div>
                  </div>
                </div>
              ))}

              {(estimate?.items ?? []).length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-900/10">
                  Escribe una actividad con números y unidades (por ejemplo, <span className="font-medium">200 kWh</span>{' '}
                  o <span className="font-medium">35 L de diésel</span>) y presiona “Analizar”.
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-2">
              {(estimate?.notes ?? []).map((n) => (
                <div key={n} className="text-xs text-slate-600">
                  {n}
                </div>
              ))}
            </div>

            {assumptions.length > 0 ? (
              <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-slate-900/10">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Supuestos</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
                  {assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </main>

        <footer className="mt-10 text-xs text-slate-500">
          EcoTrack AI es un prototipo educativo. Para reportes oficiales, usa factores locales y metodología (GHG Protocol).
        </footer>
      </div>
    </div>
  )
}
