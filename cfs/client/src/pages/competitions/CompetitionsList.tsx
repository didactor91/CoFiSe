import { useNavigate } from 'react-router-dom'

import Layout from '../../components/layout/Layout'
import { usePublicCompetitionsQuery } from '../../modules/competitions/api/queries'

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  COMPLETED: 'Finalizada',
}

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-200 text-slate-800',
}

export default function CompetitionsList() {
  const navigate = useNavigate()
  const [result] = usePublicCompetitionsQuery()
  const { data } = result
  const competitions = data?.publicCompetitions ?? []

  return (
    <Layout>
      <div className="app-shell space-y-12">
        <section className="space-y-5">
          <h2 className="section-title">Competiciones</h2>

          {competitions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">
              No hay competiciones disponibles
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {competitions.map((competition) => (
                <div
                  key={competition.id}
                  onClick={() => navigate(`/competitions/${competition.id}`)}
                  className="card card-hover cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{competition.name}</h3>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[competition.status]}`}>
                      {STATUS_LABELS[competition.status]}
                    </span>
                  </div>
                  {competition.description && (
                    <p className="mb-3 text-sm leading-6 text-slate-600">
                      {competition.description.length > 100
                        ? `${competition.description.substring(0, 100)}...`
                        : competition.description}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    👥 {competition.participantCount} participantes
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}