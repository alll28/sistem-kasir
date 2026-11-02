import { Icon } from '../../assets/icons'
import { ProductThumbnail } from '../ui/ProductThumbnail'

export function ProductCatalog({ category, search, searchRef, onSetCategory, onSetSearch, visibleProducts, categories, onAddToCart, onManageProducts }) {
  return (
    <section className="min-w-0">
      <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 text-slate-400 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:focus-within:bg-slate-800 dark:focus-within:ring-blue-900/40">
          <Icon name="search" size={18} />
          <input
            ref={searchRef}
            type="search"
            value={search}
            placeholder="Cari produk (F2)"
            onChange={(event) => onSetSearch(event.target.value)}
            className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
          {search && (
            <button type="button" className="grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => onSetSearch('')} aria-label="Hapus pencarian">
              <Icon name="close" size={14} />
            </button>
          )}
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`rounded-full border px-3.5 py-2 text-[11px] font-medium transition duration-200 ${category === item ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/15' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              onClick={() => onSetCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visibleProducts.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3.5 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
              <div className="relative h-[130px] overflow-hidden bg-slate-100 dark:bg-slate-800 sm:h-[160px]">
                <ProductThumbnail image={product.image} name={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-slate-950/55 px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm backdrop-blur-md">
                  {product.category}
                </span>
              </div>

              <div className="p-3.5">
                <h2 title={product.name} className="min-h-[38px] text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-100">{product.name}</h2>
                <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-400">{product.id}</span>

                <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <strong className="block text-sm font-bold tracking-tight text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}</strong>
                    <small className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] ${product.stock <= 5 ? 'bg-red-50 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      Stok: {product.stock}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 active:translate-y-0"
                    onClick={() => onAddToCart(product)}
                    aria-label={`Tambah ${product.name} ke keranjang`}
                  >
                    <Icon name="plus" size={20} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/70 px-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
            <Icon name={search ? 'search' : 'box'} size={24} />
          </div>
          <strong className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {search || (category !== 'Semua produk' && category !== 'Lainnya')
              ? 'Produk tidak ditemukan'
              : category === 'Lainnya'
                ? 'Belum ada produk di kategori ini'
                : 'Belum ada produk'}
          </strong>
          <span className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            {search || category !== 'Semua produk' ? 'Coba kata kunci atau kategori yang berbeda.' : 'Tambahkan produk dari menu Barang & Stok untuk mulai berjualan.'}
          </span>
          {search || (category !== 'Semua produk' && category !== 'Lainnya') ? (
            <button type="button" onClick={() => { onSetSearch(''); onSetCategory('Semua produk') }} className="mt-4 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700">
              Reset pencarian
            </button>
          ) : (
            <button type="button" onClick={onManageProducts} className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800">
              Tambah produk
            </button>
          )}
        </div>
      )}
    </section>
  )
}
