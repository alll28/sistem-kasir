import { Icon } from '../../assets/icons'
import { navigation } from '../../data/products'

export function Sidebar({ activePage, isCollapsed, isDark, isMobileOpen, onToggleSidebar, onToggleTheme, onSelectPage, onCloseMobile }) {
  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          aria-label="Tutup menu navigasi"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(85vw,300px)] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-xl transition-transform dark:border-slate-800 dark:bg-slate-900/95 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:border-r lg:shadow-none ${isMobileOpen ? 'visible translate-x-0 pointer-events-auto' : 'invisible -translate-x-full pointer-events-none'} ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[250px]'} lg:visible lg:translate-x-0 lg:pointer-events-auto`}>
      <div className="flex items-center gap-3 px-4 py-4 lg:px-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-700 to-indigo-950 text-white shadow-lg shadow-blue-900/25">
          <Icon name="cart" size={18} />
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Pos System</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Sistem kasir</div>
          </div>
        )}

        <button
          type="button"
          className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:grid"
          aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          onClick={onToggleSidebar}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
        <button
          type="button"
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
          aria-label="Tutup menu navigasi"
          onClick={onCloseMobile}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="scrollbar-thin mt-3 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3 lg:mt-8 lg:px-2.5" aria-label="Navigasi utama">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition duration-200 lg:text-sm ${activePage === item.id ? 'bg-blue-50 font-semibold text-blue-800 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/60' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}
            onClick={() => {
              onSelectPage(item.id)
              onCloseMobile()
            }}
            title={isCollapsed ? item.id : undefined}
          >
            <Icon name={item.icon} size={17} />
            {!isCollapsed && <span className="truncate">{item.id}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200/80 p-2.5 dark:border-slate-800">
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center px-0' : ''}`}
          onClick={() => {
            onToggleTheme()
            onCloseMobile()
          }}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={17} />
          {!isCollapsed && <span className="flex-1">Mode Tampilan</span>}
          {!isCollapsed && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">{isDark ? 'Terang' : 'Gelap'}</span>}
        </button>

      </div>
      </aside>
    </>
  )
}
