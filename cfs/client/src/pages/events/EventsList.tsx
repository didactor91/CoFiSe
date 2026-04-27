import { useNavigate } from 'react-router-dom'

import Layout from '../../components/layout/Layout'
import { useEventsQuery } from '../../modules/events/api/queries'

export default function EventsList() {
  const navigate = useNavigate()
  const [result] = useEventsQuery()
  const { data } = result
  const events = data?.events ?? []

  return (
    <Layout>
      <div className="app-shell space-y-12">
        <section className="space-y-5">
          <h2 className="section-title">Eventos</h2>

          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">
              No hay eventos programados
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="card card-hover cursor-pointer"
                >
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{event.name}</h3>
                  <p className="mb-1 text-sm text-slate-500">📍 {event.location}</p>
                  <p className="text-sm font-medium text-slate-700">
                    🗓 {new Date(event.startTime).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {event.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {event.description.length > 120
                        ? `${event.description.substring(0, 120)}...`
                        : event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}