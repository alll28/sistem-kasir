import { useState } from 'react'

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0)

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const startOfWeek = (date) => {
  const start = startOfDay(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function getPeriodRange(period, date) {
  if (period === 'week') {
    const start = startOfWeek(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }

  if (period === 'month') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    return { start, end: new Date(date.getFullYear(), date.getMonth() + 1, 1) }
  }

  const start = new Date(date.getFullYear(), 0, 1)
  return { start, end: new Date(date.getFullYear() + 1, 0, 1) }
}

function shiftPeriod(date, period, amount) {
  const shifted = period === 'week'
    ? startOfWeek(date)
    : period === 'month'
      ? new Date(date.getFullYear(), date.getMonth(), 1)
      : new Date(date.getFullYear(), 0, 1)
  if (period === 'week') shifted.setDate(shifted.getDate() + amount * 7)
  else if (period === 'month') shifted.setMonth(shifted.getMonth() + amount)
  else shifted.setFullYear(shifted.getFullYear() + amount)
  return shifted
}

function formatPeriodRange(period, start, end) {
  if (period === 'year') return String(start.getFullYear())
  if (period === 'month') {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(start)
  }

  const lastDay = new Date(end)
  lastDay.setDate(lastDay.getDate() - 1)
  const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
  return `${dateFormat.format(start)} – ${dateFormat.format(lastDay)} ${lastDay.getFullYear()}`
}

export function SalesReport({ transactions }) {
  const [period, setPeriod] = useState('week')
  const [periodDate, setPeriodDate] = useState(() => new Date())
  const transactionYears = transactions
    .map((transaction) => new Date(transaction.created_at).getFullYear())
    .filter(Number.isFinite)
  const years = [...new Set([new Date().getFullYear(), ...transactionYears])].sort((a, b) => b - a)
  const { start, end } = getPeriodRange(period, periodDate)
  const periodTransactions = transactions.filter((transaction) => {
    const createdAt = new Date(transaction.created_at)
    return createdAt >= start && createdAt < end
  })
  const periodSales = periodTransactions.reduce((sum, transaction) => sum + transaction.total_amount, 0)
  const periodItems = periodTransactions.reduce((sum, transaction) => (
    sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
  ), 0)
  const periodProfit = periodTransactions.reduce((sum, transaction) => (
    sum + transaction.items.reduce((itemSum, item) => itemSum + (item.line_profit || 0), 0)
  ), 0)
  const hasUnknownPurchasePrice = periodTransactions.some((transaction) => (
    transaction.items.some((item) => item.line_profit === null)
  ))

  const getTopItems = (items) => {
    const quantities = new Map()
    items.forEach((item) => {
      quantities.set(item.product_name, (quantities.get(item.product_name) || 0) + item.quantity)
    })
    const ranked = [...quantities.entries()].sort((a, b) => b[1] - a[1])
    const highestQuantity = ranked[0]?.[1] || 0
    return ranked.filter(([, quantity]) => quantity === highestQuantity)
  }

  const getItemsInRange = (rangeStart, rangeEnd) => periodTransactions
    .filter((transaction) => {
      const createdAt = new Date(transaction.created_at)
      return createdAt >= rangeStart && createdAt < rangeEnd
    })
    .flatMap((transaction) => transaction.items)

  const detailRows = []
  if (period === 'week') {
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + day)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      const items = getItemsInRange(date, nextDay)
      detailRows.push({
        label: new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        topItems: getTopItems(items),
      })
    }
  } else if (period === 'month') {
    let weekStart = startOfWeek(start)
    let weekNumber = 1
    while (weekStart < end) {
      const rangeStart = weekStart < start ? start : weekStart
      const nextWeek = new Date(weekStart)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const rangeEnd = nextWeek > end ? end : nextWeek
      const items = getItemsInRange(rangeStart, rangeEnd)
      detailRows.push({
        label: `Minggu ke-${weekNumber}`,
        range: `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(rangeStart)}–${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(rangeEnd.getTime() - 86400000))}`,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        topItems: getTopItems(items),
      })
      weekStart = nextWeek
      weekNumber += 1
    }
  } else {
    for (let month = 0; month < 12; month += 1) {
      const monthStart = new Date(start.getFullYear(), month, 1)
      const monthEnd = new Date(start.getFullYear(), month + 1, 1)
      const items = getItemsInRange(monthStart, monthEnd)
      detailRows.push({
        label: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(monthStart),
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        topItems: getTopItems(items),
      })
    }
  }

  const buckets = []
  if (period === 'year') {
    for (let month = 0; month < 12; month += 1) {
      const date = new Date(start.getFullYear(), month, 1)
      buckets.push({
        date,
        label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date),
        total: 0,
      })
    }
  } else {
    const dayCount = Math.round((end - start) / 86400000)
    for (let day = 0; day < dayCount; day += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + day)
      buckets.push({
        date,
        label: period === 'week'
          ? new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date)
          : String(date.getDate()),
        total: 0,
      })
    }
  }

  periodTransactions.forEach((transaction) => {
    const createdAt = new Date(transaction.created_at)
    const bucketIndex = period === 'year'
      ? createdAt.getMonth()
      : Math.floor((startOfDay(createdAt) - startOfDay(start)) / 86400000)
    if (buckets[bucketIndex]) buckets[bucketIndex].total += transaction.total_amount
  })

  const maxSales = Math.max(1, ...buckets.map((bucket) => bucket.total))
  const currentRange = getPeriodRange(period, new Date())
  const isCurrentPeriod = start.getTime() === currentRange.start.getTime()
  const periodLabel = period === 'week' ? 'minggu ini' : period === 'month' ? 'bulan ini' : 'tahun ini'
  const cards = [
    { label: `Penjualan ${periodLabel}`, value: formatCurrency(periodSales) },
    { label: `Transaksi ${periodLabel}`, value: periodTransactions.length },
    { label: `Barang terjual ${periodLabel}`, value: periodItems },
    { label: 'Untung kotor tercatat', value: formatCurrency(periodProfit) },
  ]

  return (
    <section className="max-w-[1060px]">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Laporan Penjualan</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ringkasan dihitung otomatis dari transaksi yang berhasil disimpan.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih periode laporan">
            {[
              { value: 'week', label: 'Mingguan' },
              { value: 'month', label: 'Bulanan' },
              { value: 'year', label: 'Tahunan' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${period === option.value ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {period === 'month' ? (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              Pilih bulan
              <input
                type="month"
                aria-label="Pilih bulan laporan"
                value={`${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`}
                max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                onChange={(event) => {
                  if (event.target.value) setPeriodDate(new Date(`${event.target.value}-01T00:00:00`))
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </label>
          ) : period === 'year' ? (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              Pilih tahun
              <select
                aria-label="Pilih tahun laporan"
                value={periodDate.getFullYear()}
                onChange={(event) => setPeriodDate(new Date(Number(event.target.value), 0, 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Periode sebelumnya" onClick={() => setPeriodDate((date) => shiftPeriod(date, period, -1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                ‹
              </button>
              <strong className="min-w-36 text-center text-sm text-slate-800 dark:text-slate-100">{formatPeriodRange(period, start, end)}</strong>
              <button type="button" aria-label="Periode berikutnya" disabled={isCurrentPeriod} onClick={() => setPeriodDate((date) => shiftPeriod(date, period, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                ›
              </button>
            </div>
          )}
        </div>
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
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Penjualan {period === 'week' ? 'per hari' : period === 'month' ? 'per tanggal' : 'per bulan'}</h3>
        <div className="mt-5 overflow-x-auto">
          <div className="grid min-w-full items-end gap-2" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(24px, 1fr))` }}>
            {buckets.map((bucket) => (
              <div key={bucket.date.toISOString()} className="grid h-40 grid-rows-[1fr_auto] items-end gap-2 text-center">
                <div className="flex h-full items-end justify-center">
                  <div
                    title={`${bucket.label}: ${formatCurrency(bucket.total)}`}
                    className="w-full max-w-12 rounded-t-lg bg-blue-600 transition-all dark:bg-blue-400"
                    style={{ height: `${bucket.total ? Math.max(6, (bucket.total / maxSales) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{bucket.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Total penjualan periode ini: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(periodSales)}</strong>
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {period === 'week'
            ? 'Barang paling banyak dibeli per hari'
            : period === 'month'
              ? 'Jumlah barang dibeli per minggu'
              : 'Barang paling banyak dibeli per bulan'}
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-3 pr-4 font-medium">{period === 'week' ? 'Hari' : period === 'month' ? 'Minggu' : 'Bulan'}</th>
                {period === 'month' && <th className="pb-3 pr-4 font-medium">Tanggal</th>}
                <th className="pb-3 pr-4 font-medium">Produk terlaris</th>
                <th className="pb-3 text-right font-medium">{period === 'month' ? 'Jumlah barang' : 'Jumlah dibeli'}</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row) => (
                <tr key={row.label} className="border-b border-slate-50 last:border-0 dark:border-slate-800/70">
                  <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{row.label}</td>
                  {period === 'month' && <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{row.range}</td>}
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {row.topItems.length
                      ? row.topItems.map(([name, quantity]) => `${name} (${quantity})`).join(', ')
                      : 'Belum ada penjualan'}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-100">{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
