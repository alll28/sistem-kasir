import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../assets/icons'
import { ProductThumbnail } from '../ui/ProductThumbnail'

export function ProductCatalog({ category, search, searchRef, onSetCategory, onSetSearch, visibleProducts, categories, onAddToCart, onScanBarcode, onManageProducts }) {
  const [barcode, setBarcode] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const barcodeInputRef = useRef(null)
  const barcodeValueRef = useRef('')
  const scannerInputRef = useRef({ timer: null, lastKeyAt: 0, characterCount: 0 })
  const onScanBarcodeRef = useRef(onScanBarcode)

  useEffect(() => {
    onScanBarcodeRef.current = onScanBarcode
  }, [onScanBarcode])

  const addScannedBarcode = (value) => {
    const scannedBarcode = value.trim()
    if (!scannedBarcode) return
    window.clearTimeout(scannerInputRef.current.timer)
    scannerInputRef.current.characterCount = 0
    onScanBarcodeRef.current(scannedBarcode)
    barcodeValueRef.current = ''
    setBarcode('')
    barcodeInputRef.current?.focus()
  }

  const submitBarcode = (event) => {
    event.preventDefault()
    addScannedBarcode(barcode)
  }

  const handleBarcodeKeyDown = (event) => {
    if (event.key.length !== 1) return

    const now = performance.now()
    const scannerInput = scannerInputRef.current
    scannerInput.characterCount = now - scannerInput.lastKeyAt < 80
      ? scannerInput.characterCount + 1
      : 1
    scannerInput.lastKeyAt = now

    window.clearTimeout(scannerInput.timer)
    if (scannerInput.characterCount >= 4) {
      scannerInput.timer = window.setTimeout(() => {
        addScannedBarcode(barcodeValueRef.current)
      }, 150)
    }
  }

  useEffect(() => {
    const scannerInput = scannerInputRef.current
    barcodeInputRef.current?.focus()
    return () => window.clearTimeout(scannerInput.timer)
  }, [])

  useEffect(() => {
    if (!isCameraOpen) return undefined

    let active = true
    let hasScanned = false
    let controls
    const videoElement = videoRef.current

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Kamera tidak tersedia. Buka aplikasi melalui HTTPS atau localhost.')
          return
        }

        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (!devices.length) {
          if (active) setCameraError('Kamera belum tersedia di perangkat ini.')
          return
        }

        const camera = devices.find(({ label }) => /back|rear|environment/i.test(label)) || devices[0]
        const reader = new BrowserMultiFormatReader()
        controls = await reader.decodeFromVideoDevice(camera.deviceId, videoElement, (result, error) => {
          if (!active || hasScanned) return
          if (result) {
            hasScanned = true
            const scannedBarcode = result.getText()
            onScanBarcodeRef.current(scannedBarcode)
            setIsCameraOpen(false)
          } else if (error && error.name !== 'NotFoundException') {
            setCameraError('Gagal membaca barcode dari kamera.')
          }
        })

        if (!active) {
          controls.stop()
          return
        }
        setCameraError('')
      } catch (error) {
        if (active) {
          const message = error.name === 'NotReadableError'
            ? 'Kamera tidak dapat dimulai. Pastikan kamera tidak sedang dipakai aplikasi lain, lalu coba lagi.'
            : error.name === 'NotAllowedError'
              ? 'Akses kamera ditolak. Izinkan penggunaan kamera di pengaturan browser.'
              : `Tidak dapat mengakses kamera: ${error.message}`
          setCameraError(message)
        }
      }
    }

    startScanner()

    return () => {
      active = false
      controls?.stop()
      if (videoElement) {
        videoElement.pause()
        videoElement.srcObject = null
      }
    }
  }, [isCameraOpen])

  return (
    <section className="min-w-0">
      <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <form onSubmit={submitBarcode} className="mb-3 flex flex-col gap-2 sm:flex-row">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 text-blue-700 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-300 dark:focus-within:bg-slate-800 dark:focus-within:ring-blue-900/40">
            <Icon name="keyboard" size={18} />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              placeholder="Scan atau masukkan kode barcode"
              onChange={(event) => {
                barcodeValueRef.current = event.target.value
                setBarcode(event.target.value)
              }}
              onKeyDown={handleBarcodeKeyDown}
              className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              aria-label="Scan atau masukkan kode barcode"
            />
          </label>
          <button type="submit" disabled={!barcode.trim()} className="h-12 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
            Masukkan
          </button>
          <button type="button" onClick={() => { setCameraError(''); setIsCameraOpen(true) }} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Icon name="search" size={16} /> Scan kamera
          </button>
        </form>

        <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 text-slate-400 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:focus-within:bg-slate-800 dark:focus-within:ring-blue-900/40">
          <Icon name="search" size={18} />
          <input
            ref={searchRef}
            type="search"
            value={search}
            placeholder="Cari produk"
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
          {visibleProducts.map((product) => {
            const stock = Number(product.stock || 0)
            const outOfStock = stock <= 0
            const lowStock = stock > 0 && stock <= 10

            return (
            <article key={product.id} className={`group overflow-hidden rounded-2xl border shadow-sm shadow-slate-900/5 transition duration-200 ${outOfStock ? 'border-slate-200 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-800' : lowStock ? 'border-red-200 bg-red-50 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/10 dark:border-red-900 dark:bg-red-950/30' : 'border-white/80 bg-white hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900'}`}>
              <div className="relative h-[130px] overflow-hidden bg-slate-100 dark:bg-slate-800 sm:h-[160px]">
                <ProductThumbnail image={product.image} name={product.name} className={`h-full w-full object-cover transition duration-500 ${outOfStock ? 'grayscale' : 'group-hover:scale-[1.04]'}`} />
                <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-slate-950/55 px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm backdrop-blur-md">
                  {product.category}
                </span>
              </div>

              <div className="p-3.5">
                <h2 title={product.name} className="min-h-[38px] text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-100">{product.name}</h2>
                <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-400">{product.id}</span>

                <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <strong className={`block text-sm font-bold tracking-tight ${outOfStock ? 'text-slate-500 dark:text-slate-400' : 'text-blue-700 dark:text-blue-300'}`}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}</strong>
                    <span className="block text-[9px] text-slate-500 dark:text-slate-400">per satuan</span>
                    {product.bulkPrice != null && product.bulkUnit && (
                      <span className="mt-1 block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {product.bulkUnit}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.bulkPrice)}
                      </span>
                    )}
                    <small className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] ${outOfStock ? 'bg-slate-200 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300' : lowStock ? 'bg-red-50 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {outOfStock ? 'Stok habis' : lowStock ? `Stok menipis: ${stock}` : `Stok: ${stock}`}
                    </small>
                  </div>

                  <div className="grid shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={outOfStock}
                      className="rounded-lg bg-blue-700 px-2.5 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                      onClick={() => onAddToCart(product, 'unit')}
                      aria-label={`Tambah ${product.name} satuan ke keranjang`}
                    >
                      Satuan
                    </button>
                    {product.bulkPrice != null && product.bulkUnit && (
                      <button
                        type="button"
                        disabled={outOfStock}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                        onClick={() => onAddToCart(product, 'bulk')}
                        aria-label={`Tambah ${product.name} ${product.bulkUnit} ke keranjang`}
                      >
                        Banyak · {product.bulkUnit}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
            )
          })}
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
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="cashier-barcode-camera-title">
          <section className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="cashier-barcode-camera-title" className="text-base font-semibold text-slate-900 dark:text-white">Scan barcode barang</h2>
              <button type="button" onClick={() => setIsCameraOpen(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Tutup
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-slate-950">
              <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
            </div>
            {cameraError
              ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{cameraError}</p>
              : <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">Arahkan kamera ke barcode. Produk akan otomatis masuk ke keranjang setelah terbaca.</p>}
          </section>
        </div>
      )}
    </section>
  )
}
