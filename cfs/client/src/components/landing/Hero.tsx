import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section
      data-testid="hero-section"
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Decorative blur circles */}
      <div className="absolute top-[-100px] left-[-100px] h-[300px] w-[300px] rounded-full bg-slate-700/50 blur-[100px]" />
      <div className="absolute bottom-[-100px] right-[-100px] h-[250px] w-[250px] rounded-full bg-slate-600/30 blur-[80px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Bienvenido a CFS
        </h1>
        <p className="mb-8 text-lg text-slate-300 sm:text-xl">
          Explora nuestro catálogo de productos...
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/catalog" className="btn-primary px-6 py-3">
            Ver catálogo
          </Link>
          <Link to="/login" className="btn-secondary px-6 py-3">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  )
}
