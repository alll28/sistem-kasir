import { Icon } from '../../assets/icons'

export function PaymentPanel({ cart, onSetCart, discount, onSetDiscount, discountType, onSetDiscountType, taxEnabled, onToggleTax, paymentMethod, onSelectPayment, itemCount, subtotal, discountValue, tax, total, onOpenCheckout, onClearCart, discountRef }) {
  const updateQuantity = (productId, amount) => {
    onSetCart((current) => current
      .map((item) => item.product.id === productId
        ? { ...item, quantity: Math.min(item.product.stock, item.quantity + amount) }
        : item)
      .filter((item) => item.quantity > 0))
  }

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:w-[330px]">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Ringkasan Pembayaran</h2>
          <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{itemCount} item dalam keranjang</span>
        </div>
        {itemCount > 0 && <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 dark:bg-slate-800 dark:text-blue-300">{itemCount}</span>}
      </div>

      <div className="px-4 py-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Item Dipilih</h3>

        {cart.length === 0 ? (
          <div className="flex min-h-[110px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <Icon name="cart" size={24} className="text-slate-300" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Keranjang masih kosong</span>
            <small className="text-[10px] text-slate-400">Pilih produk untuk memulai transaksi</small>
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[210px] space-y-3 overflow-y-auto pr-1">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-b-0 dark:border-slate-700">
                <div className="min-w-0">
                  <strong className="block truncate text-[10px] font-semibold text-slate-800 dark:text-slate-100">{product.name}</strong>
                  <span className="mt-1 block text-[10px] font-semibold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price * quantity)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={() => updateQuantity(product.id, -1)} aria-label={`Kurangi ${product.name}`}>
                    <Icon name="minus" size={12} />
                  </button>
                  <span className="min-w-[14px] text-center text-[10px] font-semibold text-slate-700 dark:text-slate-200">{quantity}</span>
                  <button type="button" className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={() => updateQuantity(product.id, 1)} aria-label={`Tambah ${product.name}`}>
                    <Icon name="plus" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 border-t border-dashed border-slate-200 px-0 py-3 dark:border-slate-700">
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

        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <label className="flex items-center gap-2">
            <strong className="font-semibold text-slate-700 dark:text-slate-200">PPN 11%</strong>
            <button type="button" className={`flex h-5 w-8 items-center rounded-full p-0.5 transition ${taxEnabled ? 'bg-blue-700' : 'bg-slate-300 dark:bg-slate-700'}`} role="switch" aria-checked={taxEnabled} aria-label="Aktifkan PPN" onClick={onToggleTax}>
              <span className={`h-4 w-4 rounded-full bg-white transition ${taxEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
            </button>
          </label>
          <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tax)}</span>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Total pembayaran</span>
          <strong className="text-[28px] font-bold tracking-tight text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}</strong>
        </div>
      </div>

      <div className="mx-4 mt-2 rounded-xl bg-blue-50 p-3 dark:bg-slate-800/80">
        <span className="mb-2 block text-[9px] text-slate-500 dark:text-slate-400">Metode pembayaran:</span>
        <div className="grid grid-cols-3 gap-2">
          {['Tunai', 'QRIS', 'Debit'].map((method) => (
            <button
              key={method}
              type="button"
              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[9px] transition ${paymentMethod === method ? 'border-blue-200 bg-white text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
              onClick={() => onSelectPayment(method)}
            >
              {method === 'Tunai' ? <Icon name="wallet" size={12} /> : method === 'QRIS' ? <Icon name="receipt" size={12} /> : <Icon name="box" size={12} />}
              {method}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
        <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 text-[11px] font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700" disabled={!cart.length} onClick={onOpenCheckout}>
          Bayar (F9)
        </button>

        <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-red-950/30" disabled={!cart.length} onClick={onClearCart}>
          <Icon name="trash" size={14} /> Hapus keranjang
        </button>
      </div>
    </aside>
  )
}
