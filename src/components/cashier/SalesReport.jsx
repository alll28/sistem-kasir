const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0)

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export function SalesReport({ transactions }) {
  const today = startOfDay(new Date())
  const todayTransactions = transactions.filter((transaction) => new Date(transaction.created_at) >= today)
  const todaySales = todayTransactions.reduce((sum, transaction) => sum + transaction.total_amount, 0)
  const todayItems = todayTransactions.reduce((sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  const todayProfit = todayTransactions.reduce((sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + (item.line_profit || 0), 0), 0)
  const hasUnknownPurchasePrice = todayTransactions.some((transaction) => transaction.items.some((item) => item.line_profit === null))

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const dayTransactions = transactions.filter((transaction) => startOfDay(new Date(transaction.created_at)).getTime() === date.getTime())
    return {
      date,
      total: dayTransactions.reduce((sum, transaction) => sum + transaction.total_amount, 0),
    }
  })
  const maxDailySales = Math.max(1, ...lastSevenDays.map((day) => day.total))

  const cards = [
    { label: 'Penjualan hari ini', value: formatCurrency(todaySales) },
    { label: 'Transaksi hari ini', value: todayTransactions.length },
    { label: 'Barang terjual hari ini', value: todayItems },
    { label: 'Untung kotor tercatat', value: formatCurrency(todayProfit) },
  ]

  return (
    <section className="max-w-[1060px]">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Laporan Penjualan</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ringkasan dihitung otomatis dari transaksi yang berhasil disimpan.</p>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{card.label}</span>
            <strong className="mt-2 block text-xl font-bold text-blue-700 dark:text-blue-300">{card.value}</strong>
          </article>
        ))}
      </div>
      {hasUnknownPurchasePrice && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Sebagian produk belum memiliki harga beli. Untung kotor hanya menjumlahkan produk dengan harga beli yang tercatat.
        </p>
      )}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Penjualan 7 hari terakhir</h3>
        <div className="mt-5 grid grid-cols-7 items-end gap-2">
          {lastSevenDays.map((day) => (
            <div key={day.date.toISOString()} className="grid h-40 grid-rows-[1fr_auto] items-end gap-2 text-center">
              <div className="flex h-full items-end justify-center">
                <div
                  title={formatCurrency(day.total)}
                  className="w-full max-w-12 rounded-t-lg bg-blue-600 transition-all dark:bg-blue-400"
                  style={{ height: `${day.total ? Math.max(6, (day.total / maxDailySales) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(day.date)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Total penjualan tercatat: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(transactions.reduce((sum, transaction) => sum + transaction.total_amount, 0))}</strong>
        </p>
      </section>
    </section>
  )
}
