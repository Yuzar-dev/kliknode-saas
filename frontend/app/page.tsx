export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-3xl space-y-8 text-center">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white">
            Kliknode
          </h1>
          <p className="text-xl text-gray-300">
            Plateforme NFC Multi-Pays pour Cartes de Visite Digitales
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl">🚀</div>
            <h2 className="mb-2 text-lg font-semibold text-white">Backend</h2>
            <p className="text-sm text-gray-300">
              API opérationnelle sur{' '}
              <code className="rounded bg-black/30 px-2 py-1">localhost:3000</code>
            </p>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                ✓ Connecté
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl">🎨</div>
            <h2 className="mb-2 text-lg font-semibold text-white">Frontend</h2>
            <p className="text-sm text-gray-300">
              Next.js fonctionnel sur{' '}
              <code className="rounded bg-black/30 px-2 py-1">localhost:3001</code>
            </p>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                ✓ Actif
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4 rounded-lg bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Accès Rapides</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              🔐 Login
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700"
            >
              ✨ Sign Up
            </a>
            <a
              href="/admin"
              className="rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition hover:bg-purple-700"
            >
              👑 Admin
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-3 text-sm text-gray-400">
          <p className="font-semibold text-gray-300">Stack Technique</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1">Next.js 15</span>
            <span className="rounded-full bg-white/10 px-3 py-1">React 19</span>
            <span className="rounded-full bg-white/10 px-3 py-1">TypeScript</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Tailwind CSS</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Shadcn/UI</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Zustand</span>
            <span className="rounded-full bg-white/10 px-3 py-1">React Query</span>
          </div>
        </div>

        {/* Phase Info */}
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 text-left backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
            <span className="text-sm font-semibold text-white">Phase 2.1 : Infrastructure ✅</span>
          </div>
          <p className="text-sm text-gray-300">
            Prochaine étape : Phase 2.2 - Pages d'authentification (Login, Signup, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
