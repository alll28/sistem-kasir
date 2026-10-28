import { Icon } from '../../assets/icons'

export function CheckoutModal({ itemCount, paymentMethod, total, onClose, onComplete, isSaving = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-5 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button type="button" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-label="Tutup" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
          <Icon name="receipt" size={26} />
        </div>

        <h2 id="checkout-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Konfirmasi pembayaran</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Pastikan detail transaksi sudah sesuai sebelum melanjutkan.</p>

        <div className="mt-5 space-y-3 border-y border-slate-200 py-4 text-left dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Jumlah item</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-100">{itemCount} item</strong>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Metode pembayaran</span>
            <strong className="font-semibold text-slate-800 dark:text-slate-100">{paymentMethod}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-[11px] dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Total pembayaran</span>
            <strong className="text-lg font-bold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}</strong>
          </div>
        </div>

        <button type="button" disabled={isSaving} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" onClick={onComplete}>
          <Icon name="check" size={17} /> {isSaving ? 'Menyimpan transaksi...' : 'Konfirmasi & selesaikan'}
        </button>

        <button type="button" disabled={isSaving} className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={onClose}>
          Kembali ke keranjang
        </button>
      </section>
    </div>
  )
}
