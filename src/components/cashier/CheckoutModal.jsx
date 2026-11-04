import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../assets/icons'

export function CheckoutModal({ itemCount, paymentMethod, total, qrisMode, onSelectQrisMode, onClose, onComplete, isSaving = false }) {
  const videoRef = useRef(null)
  const [cameraError, setCameraError] = useState('')
  const [cameraResult, setCameraResult] = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  const [cashReceived, setCashReceived] = useState('')

  const isQrisMode = paymentMethod === 'QRIS' || paymentMethod.startsWith('QRIS ')
  const cashReceivedAmount = cashReceived === '' ? 0 : Number(cashReceived)
  const validCashReceived = Number.isSafeInteger(cashReceivedAmount)
  const change = validCashReceived ? Math.max(0, cashReceivedAmount - total) : 0
  const insufficientCash = !isQrisMode && (!validCashReceived || cashReceivedAmount < total)
  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

  useEffect(() => {
    if (!isQrisMode || qrisMode !== 'tampil') return undefined

    let cancelled = false
    let controls
    const videoElement = videoRef.current

    const startScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()

        if (!videoElement) return

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (!devices.length) {
          if (!cancelled) {
            setCameraError('Kamera belum tersedia di perangkat ini.')
            setScannerReady(false)
          }
          return
        }

        controls = await reader.decodeFromVideoDevice(undefined, videoElement, (result, error) => {
          if (cancelled) return

          if (result) {
            setCameraResult(result.getText())
            setScannerReady(true)
            controls?.stop()
            return
          }

          if (error && error.name !== 'NotFoundException') {
            setCameraError('Gagal membaca kode QR dari kamera.')
          }
        })

        if (cancelled) {
          controls.stop()
          return
        }

        setCameraError('')
        setScannerReady(true)
      } catch (error) {
        if (!cancelled) {
          setCameraError(`Tidak dapat mengakses kamera: ${error.message}`)
          setScannerReady(false)
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      controls?.stop()
      if (videoElement) {
        videoElement.pause()
        videoElement.srcObject = null
      }
    }
  }, [isQrisMode, qrisMode])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-5 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="relative max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button type="button" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-label="Tutup" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
          <Icon name="receipt" size={26} />
        </div>

        <h2 id="checkout-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isQrisMode && qrisMode === 'pilih'
            ? 'Pilih cara pembayaran QRIS'
            : isQrisMode && qrisMode === 'tampil'
              ? 'Scan QR pembeli'
              : 'Konfirmasi pembayaran'}
        </h2>

        {isQrisMode && qrisMode === 'pilih' ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { value: 'tampil', label: 'Tampilkan QRIS', description: 'Buka kamera untuk scan QR pembeli' },
              { value: 'scan', label: 'Scan QRIS', description: 'Tampilkan QRIS toko untuk dibayar' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-slate-700"
                onClick={() => onSelectQrisMode(option.value)}
              >
                <strong className="block text-sm font-semibold text-slate-900 dark:text-white">{option.label}</strong>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
              </button>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">
              {itemCount} item · {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}
            </p>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:col-span-2" onClick={onClose}>
              Kembali ke keranjang
            </button>
          </div>
        ) : isQrisMode && qrisMode === 'tampil' ? (
          <div className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 dark:border-slate-700">
              <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl object-cover" />
            </div>

            {cameraError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{cameraError}</p>
            )}

            {!cameraError && !cameraResult && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Arahkan kamera ke kode QR pembeli untuk memindai.</p>
            )}

            {cameraResult && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <strong className="font-semibold">QR berhasil dipindai:</strong>
                <div className="mt-1 break-all">{cameraResult}</div>
              </div>
            )}

            {scannerReady && !cameraResult && (
              <p className="mt-3 text-xs text-blue-600 dark:text-blue-300">Kamera aktif dan siap dipindai.</p>
            )}
          </div>
        ) : !isQrisMode ? (
          <div className="mt-5 space-y-4 text-left">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Total pembayaran</span>
                <strong className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(total)}</strong>
              </div>
            </div>

            <label htmlFor="cash-received" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Uang diterima
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">Rp</span>
              <input
                id="cash-received"
                aria-label="Jumlah uang diterima"
                type="text"
                inputMode="numeric"
                autoFocus
                value={cashReceived.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                onChange={(event) => setCashReceived(event.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan jumlah uang"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Uang kembalian</span>
              <strong className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(change)}</strong>
            </div>

            {insufficientCash && cashReceived !== '' && (
              <p className="text-xs text-red-600 dark:text-red-300">Masukkan jumlah uang yang valid dan tidak kurang dari total pembayaran.</p>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="mx-auto flex w-full max-w-[440px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700">
              <img
                src="/qris-pembayaran.png"
                alt="Kode QRIS pembayaran ATK & Accessories"
                className="max-h-[58vh] w-auto max-w-full object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan QRIS milik toko berikut menggunakan aplikasi pembayaran.</p>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-left dark:bg-slate-800/80">
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
          </div>
        )}

        {!isQrisMode ? (
          <>
            <button type="button" disabled={isSaving || !itemCount || insufficientCash} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onComplete(cashReceivedAmount)}>
              <Icon name="check" size={17} /> {isSaving ? 'Menyimpan transaksi...' : insufficientCash ? 'Uang pembayaran belum cukup' : 'Konfirmasi & selesaikan'}
            </button>

            <button type="button" disabled={isSaving} className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={onClose}>
              Kembali ke keranjang
            </button>
          </>
        ) : qrisMode !== 'tampil' && qrisMode !== 'pilih' ? (
          <>
            <button type="button" disabled={isSaving || !itemCount} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" onClick={onComplete}>
              <Icon name="check" size={17} /> {isSaving ? 'Menyimpan transaksi...' : itemCount ? isQrisMode ? 'Selesai' : 'Konfirmasi & selesaikan' : 'Tambahkan item terlebih dahulu'}
            </button>

            <button type="button" disabled={isSaving} className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={onClose}>
              Kembali ke keranjang
            </button>
          </>
        ) : qrisMode === 'tampil' ? (
          <button type="button" disabled={isSaving || !cameraResult || !itemCount} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60" onClick={onComplete}>
            <Icon name="check" size={17} /> {isSaving ? 'Menyimpan transaksi...' : !itemCount ? 'Tambahkan item terlebih dahulu' : cameraResult ? 'Selesai' : 'Tunggu scan QR'}
          </button>
        ) : null}
      </section>
    </div>
  )
}
