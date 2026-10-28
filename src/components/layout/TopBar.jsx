import { Icon } from '../../assets/icons'

export function TopBar({ activePage, clock, onNotify, onProfileClick }) {
  return (
    <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{activePage}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">{activePage === 'Kasir' ? 'Toko Sumber Rezeki' : 'Kelola operasional toko Anda'}</p>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-blue-700 shadow-sm transition hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
          aria-label="Notifikasi"
          onClick={onNotify}
        >
          <Icon name="bell" size={18} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-white dark:ring-slate-900" />
        </button>

        <div className="flex h-10 flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <strong className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Waktu</strong>
          <span className="text-[10px] text-slate-600 dark:text-slate-300">{clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900"
          onClick={onProfileClick}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="hidden sm:block">
            <strong className="block text-[11px] font-semibold text-slate-900 dark:text-white">Akbar Hidayat</strong>
            <small className="block text-[9px] text-slate-500 dark:text-slate-400">Kasir</small>
          </span>
        </button>
      </div>
    </header>
  )
}
