export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer role="contentinfo" className="app-shell text-center">
      <p className="text-sm text-slate-500">© {year} CFS. Todos los derechos reservados.</p>
    </footer>
  )
}
