const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0)

const formatDate = (value) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export function TransactionHistory({ transactions }) {
  return (
    <section className="max-w-[1060px]">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Riwayat Transaksi</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Daftar transaksi yang sudah berhasil dibayar.</p>
      </header>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {transactions.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction) => (
              <article key={transaction.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{transaction.transaction_number}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 dark:bg-slate-800 dark:text-blue-300">{transaction.payment_method}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(transaction.created_at)}</p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    {(transaction.items || []).map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}
                  </p>
                </div>
                <strong className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatCurrency(transaction.total_amount)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center p-6 text-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Belum ada transaksi</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Transaksi yang selesai akan otomatis muncul di sini.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
