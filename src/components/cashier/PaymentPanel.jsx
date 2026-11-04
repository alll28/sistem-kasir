import { Icon } from '../../assets/icons'
import { getSaleLabel, getSalePrice } from '../../lib/sale'

export function PaymentPanel({ cart, onSetCart, discount, onSetDiscount, discountType, onSetDiscountType, paymentMethod, onSelectPayment, itemCount, subtotal, discountValue, total, isSaving, payButtonRef, onOpenCheckout, onClearCart, discountRef }) {
  const updateQuantity = (productId, saleType, amount) => {
    onSetCart((current) => {
      const target = current.find((item) => item.product.id === productId && item.saleType === saleType)
      if (!target) return current

      const nextQuantity = target.quantity + amount
      const totalProductQuantity = current
        .filter((item) => item.product.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0)
      if (amount > 0 && totalProductQuantity >= target.product.stock) return current

      return current
        .map((item) => item.product.id === productId && item.saleType === saleType
          ? { ...item, quantity: nextQuantity }
          : item)
        .filter((item) => item.quantity > 0)
    })
  }

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-lg shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 xl:sticky xl:top-6 xl:w-[350px]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white via-sky-50/70 to-amber-50/70 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-blue-950/60 dark:to-indigo-950/70">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Ringkasan Pembayaran</h2>
          <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{itemCount} item dalam keranjang</span>
        </div>
        {itemCount > 0 && <span className="grid h-8 min-w-8 place-items-center rounded-xl bg-blue-100 px-2 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">{itemCount}</span>}
      </div>

      <div className="px-4 py-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Item Dipilih</h3>

        {cart.length === 0 ? (
          <div className="flex min-h-[130px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <span className="mb-1 grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
              <Icon name="cart" size={20} />
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Keranjang masih kosong</span>
            <small className="text-[10px] text-slate-400">Pilih produk untuk memulai transaksi</small>
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[210px] space-y-3 overflow-y-auto pr-1">
            {cart.map(({ product, quantity, saleType = 'unit' }) => (
              <div key={`${product.id}-${saleType}`} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 dark:border-slate-800">
                <div className="min-w-0">
                  <strong className="block truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">{product.name}</strong>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">{getSaleLabel(product, saleType)} · {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getSalePrice(product, saleType))}</span>
                  <span className="mt-1 block text-[10px] font-semibold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getSalePrice(product, saleType) * quantity)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => updateQuantity(product.id, saleType, -1)} aria-label={`Kurangi ${product.name}`}>
                    <Icon name="minus" size={12} />
                  </button>
                  <span className="min-w-[18px] text-center text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">{quantity}</span>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => updateQuantity(product.id, saleType, 1)} aria-label={`Tambah ${product.name}`}>
                    <Icon name="plus" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 border-t border-slate-100 px-0 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>Sub total</span>
          <strong className="font-semibold text-slate-700 dark:text-slate-200">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subtotal)}</strong>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-700 dark:text-slate-200">Diskon (F7)</strong>
            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountValue)}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <label className="relative flex h-8 w-[68px] items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <select value={discountType} onChange={(event) => onSetDiscountType(event.target.value)} aria-label="Jenis diskon" className="w-full appearance-none bg-transparent px-2.5 pr-5 text-[10px] text-slate-700 outline-none dark:text-slate-200">
                <option value="percent">%</option>
                <option value="amount">Rp</option>
              </select>
              <Icon name="chevron" size={12} className="pointer-events-none absolute right-2 text-slate-400" />
            </label>
            <input
              ref={discountRef}
              aria-label="Nilai diskon"
              type="number"
              min="0"
              max={discountType === 'percent' ? '100' : undefined}
              placeholder="0"
              value={discount}
              onChange={(event) => onSetDiscount(event.target.value)}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-sky-50 to-blue-50 p-3 dark:border-blue-900/70 dark:from-amber-400/10 dark:via-blue-950/80 dark:to-indigo-950/80">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Total pembayaran</span>
          <strong className="text-[26px] font-bold tracking-tight text-blue-800 dark:text-blue-200">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}</strong>
        </div>
      </div>

      <div className="mx-4 mt-1 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/60">
        <span className="mb-2 block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Metode pembayaran</span>
        <div className="grid grid-cols-2 gap-2">
          {['Tunai', 'QRIS'].map((method) => (
            <button
              key={method}
              type="button"
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-semibold transition ${paymentMethod === method ? 'border-blue-300 bg-white text-blue-800 shadow-sm ring-2 ring-blue-100 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:ring-blue-950' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
              onClick={() => onSelectPayment(method)}
            >
              {method === 'Tunai' ? <Icon name="wallet" size={12} /> : <Icon name="receipt" size={12} />}
              {method}
            </button>
          ))}
        </div>

      </div>

      <div className="space-y-2 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
        <button ref={payButtonRef} type="button" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 text-xs font-semibold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/20 active:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700" disabled={!cart.length || isSaving} onClick={onOpenCheckout}>
          {isSaving ? 'Menyimpan transaksi...' : 'Bayar'}
        </button>

        <button type="button" className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900 dark:hover:bg-red-950/30" disabled={!cart.length} onClick={onClearCart}>
          <Icon name="trash" size={14} /> Hapus keranjang
        </button>
      </div>
    </aside>
  )
}
