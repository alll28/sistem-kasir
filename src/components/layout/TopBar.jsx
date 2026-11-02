import { Icon } from '../../assets/icons'

export function TopBar({ activePage, clock, onToggleMobileSidebar, isMobileSidebarOpen }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          aria-label={isMobileSidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={isMobileSidebarOpen}
          onClick={onToggleMobileSidebar}
        >
          <Icon name={isMobileSidebarOpen ? 'close' : 'menu'} size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-400/20" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-800 dark:text-sky-200">Toko Sumber Rezeki</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-[28px]">{activePage}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activePage === 'Kasir' ? 'Kelola penjualan dan pembayaran dengan mudah.' : 'Kelola operasional toko Anda.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-blue-800 dark:bg-blue-900/60 dark:text-sky-200">
            <Icon name="receipt" size={17} />
          </span>
          <span>
            <strong className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Waktu lokal</strong>
            <span className="mt-0.5 block text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </span>
        </div>
      </div>
    </header>
  )
}
