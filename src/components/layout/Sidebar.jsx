import { Icon } from '../../assets/icons'
import { navigation } from '../../data/products'

export function Sidebar({ activePage, isCollapsed, isDark, onToggleSidebar, onToggleTheme, onSelectPage, onLogout }) {
  return (
    <aside className={`w-full shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm transition-all dark:border-slate-700 dark:bg-slate-900/90 lg:w-[236px] lg:border-b-0 lg:border-r ${isCollapsed ? 'lg:w-[88px]' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-4 lg:px-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-700 text-white shadow-sm">
          <Icon name="cart" size={18} />
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Pos System</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Sistem kasir</div>
          </div>
        )}

        <button
          type="button"
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          onClick={onToggleSidebar}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="mt-3 flex flex-col gap-1.5 px-2.5 pb-3 lg:mt-6" aria-label="Navigasi utama">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activePage === item.id ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'} ${isCollapsed ? 'justify-center px-0 lg:w-full' : ''}`}
            onClick={() => onSelectPage(item.id)}
            title={isCollapsed ? item.id : undefined}
          >
            <Icon name={item.icon} size={17} />
            {!isCollapsed && <span className="truncate">{item.id}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-2.5 dark:border-slate-700">
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center px-0' : ''}`}
          onClick={onToggleTheme}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={17} />
          {!isCollapsed && <span className="flex-1">Mode Tampilan</span>}
          {!isCollapsed && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">{isDark ? 'Terang' : 'Gelap'}</span>}
        </button>

        <button
          type="button"
          className={`mt-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 ${isCollapsed ? 'justify-center px-0' : ''}`}
          onClick={onLogout}
        >
          <Icon name="logout" size={17} />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}
