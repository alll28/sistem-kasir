import { Icon } from '../../assets/icons'
import { getProductImageUrl } from '../../utils/productImage'

export function ProductCatalog({ category, search, searchRef, onSetCategory, onSetSearch, visibleProducts, categories, onAddToCart }) {
  return (
    <section className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus-within:ring-blue-900/40">
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
              className={`rounded-lg border px-3 py-1.5 text-[11px] transition ${category === item ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
              onClick={() => onSetCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visibleProducts.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="relative h-[120px] overflow-hidden bg-slate-100 dark:bg-slate-800 sm:h-[138px]">
                <img
                  src={getProductImageUrl(product.image)}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                />
                <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] font-medium text-white ${product.category === 'Minuman' ? 'bg-blue-600' : 'bg-sky-500'}`}>
                  {product.category}
                </span>
              </div>

              <div className="p-3">
                <h2 title={product.name} className="min-h-[32px] text-xs font-semibold leading-4 text-slate-800 dark:text-slate-100">{product.name}</h2>
                <span className="mt-1 block text-[10px] text-slate-400">{product.id}</span>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block text-[12px] font-bold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}</strong>
                    <small className={`text-[10px] ${product.stock <= 5 ? 'font-semibold text-red-500' : 'text-slate-400'}`}>
                      Stok: {product.stock}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-xl bg-blue-700 text-white shadow-sm transition hover:bg-blue-800"
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
        <div className="mt-4 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
            <Icon name="search" size={22} />
          </div>
          <strong className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {category === 'Lainnya' ? 'Belum ada produk di kategori ini' : 'Produk tidak ditemukan'}
          </strong>
          <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Coba kata kunci atau kategori yang berbeda.</span>
          <button type="button" onClick={() => { onSetSearch(''); onSetCategory('Semua produk') }} className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-300">
            Tampilkan semua produk
          </button>
        </div>
      )}
    </section>
  )
}
