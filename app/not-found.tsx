import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-8">
        <p className="text-5xl font-bold text-zinc-500">404</p>
        <h2 className="mt-3 text-lg font-semibold text-zinc-200">
          Pagina nao encontrada
        </h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-400">
          O endereco que voce tentou acessar nao existe ou foi movido.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  )
}
