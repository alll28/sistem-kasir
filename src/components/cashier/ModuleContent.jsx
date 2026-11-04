import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../assets/icons'
import { navigation } from '../../data/products'
import { ProductThumbnail } from '../ui/ProductThumbnail'

const defaultForm = {
  name: '',
  category: 'Makanan',
  newCategory: '',
  purchasePrice: '',
  price: '',
  bulkPrice: '',
  bulkUnit: '',
  unit: 'Satuan',
  stock: '',
  description: '',
  barcode: '',
}

const fieldClassName = 'block w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-800 dark:focus:ring-blue-900/40'
const labelClassName = 'grid min-w-0 gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300'
const productsPerPage = 20

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('File gambar gagal dibaca. Silakan coba pilih file lain.'))
    reader.readAsDataURL(file)
  })
}

export function ModuleContent({ activePage, productList, categories, onAddProduct, onUpdateProduct, onDeleteProduct, onBackToCashier }) {
  const selectedIcon = navigation.find((item) => item.id === activePage)?.icon || 'box'
  const availableCategories = useMemo(
    () => categories.filter((item) => item !== 'Semua produk' && item !== 'Lainnya'),
    [categories],
  )
  const [form, setForm] = useState(() => ({
    ...defaultForm,
    category: availableCategories[0] || '__new_category__',
  }))
  const [productImage, setProductImage] = useState('')
  const [barcodeImage, setBarcodeImage] = useState('')
  const [formError, setFormError] = useState('')
  const [productActionError, setProductActionError] = useState('')
  const [editingProductId, setEditingProductId] = useState('')
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [productPage, setProductPage] = useState(0)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [imageFeedback, setImageFeedback] = useState('')
  const [barcodeFeedback, setBarcodeFeedback] = useState('')
  const [showBarcodePhotoOptions, setShowBarcodePhotoOptions] = useState(false)
  const [cameraMode, setCameraMode] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const galleryInputRef = useRef(null)
  const barcodeGalleryInputRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const scannerControlsRef = useRef(null)

  const summary = useMemo(() => {
    const totalStock = productList.reduce((sum, product) => sum + Number(product.stock || 0), 0)
    const lowStock = productList.filter((product) => {
      const stock = Number(product.stock || 0)
      return stock > 0 && stock <= 10
    }).length

    return {
      totalProducts: productList.length,
      totalStock,
      lowStock,
    }
  }, [productList])
  const pageCount = Math.ceil(productList.length / productsPerPage)
  const currentPage = Math.min(productPage, Math.max(0, pageCount - 1))
  const visibleProducts = productList.slice(currentPage * productsPerPage, (currentPage + 1) * productsPerPage)

  const expectedProfit = Number(form.price || 0) - Number(form.purchasePrice || 0)

  const openCamera = (mode) => {
    setCameraError('')
    setCameraReady(false)
    setCameraMode(mode)
  }

  useEffect(() => {
    if (!cameraMode) return undefined

    let active = true

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Kamera tidak tersedia. Buka aplikasi melalui HTTPS atau localhost dan gunakan browser yang mendukung kamera.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        cameraStreamRef.current = stream
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          await cameraVideoRef.current.play()
          if (!active) return

          setCameraReady(true)
          if (cameraMode === 'barcode') {
            const { BrowserMultiFormatReader } = await import('@zxing/browser')
            const reader = new BrowserMultiFormatReader()
            const controls = await reader.decodeFromVideoElement(
              cameraVideoRef.current,
              (result) => {
                if (!result || !active) return

                const barcode = result.getText()
                setForm((current) => ({ ...current, barcode }))
                setBarcodeFeedback(`Barcode ${barcode} berhasil dipindai dari kamera.`)
                setCameraMode('')
              },
            )

            if (active) {
              scannerControlsRef.current = controls
            } else {
              controls.stop()
            }
          }
        }
      } catch (error) {
        if (!active) return
        if (cameraMode === 'barcode' && error.name !== 'NotAllowedError' && error.name !== 'PermissionDeniedError' && error.name !== 'NotFoundError') {
          setCameraError('Pemindaian barcode tidak dapat dimulai. Coba tutup aplikasi lain yang menggunakan kamera lalu buka kembali.')
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('Izin kamera ditolak. Izinkan akses kamera di browser lalu tekan tombol Kamera kembali.')
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError('Kamera tidak ditemukan pada perangkat ini.')
        } else {
          setCameraError('Kamera gagal dibuka. Pastikan kamera tidak sedang digunakan aplikasi lain.')
        }
      }
    }

    startCamera()
    return () => {
      active = false
      scannerControlsRef.current?.stop()
      scannerControlsRef.current = null
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
  }, [cameraMode])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  const handleProductImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageFeedback('Pilih file gambar dengan format yang didukung.')
      return
    }

    try {
      setProductImage(await readImageFile(file))
      setImageFeedback(`Gambar ${file.name} berhasil dipilih.`)
    } catch (error) {
      setImageFeedback(error.message)
    }
  }

  const handleBarcodeImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setBarcodeFeedback('Pilih foto barcode dengan format gambar yang didukung.')
      return
    }

    let imageData
    let scannerLibrary
    try {
      imageData = await readImageFile(file)
      setBarcodeImage(imageData)
      scannerLibrary = await import('@zxing/browser')
    } catch (error) {
      setBarcodeFeedback(error.message)
      return
    }

    try {
      const result = await new scannerLibrary.BrowserMultiFormatReader().decodeFromImageUrl(imageData)
      const barcode = result.getText()
      setForm((current) => ({ ...current, barcode }))
      setBarcodeFeedback(`Barcode ${barcode} berhasil dipindai dari foto.`)
    } catch {
      setBarcodeFeedback('Foto barcode tersimpan, tetapi kodenya belum terbaca. Coba foto lebih jelas atau masukkan kodenya secara manual.')
    }
  }

  const generateBarcode = () => {
    let barcode
    do {
      barcode = `KW-${Math.floor(100000 + Math.random() * 900000)}`
    } while (productList.some((product) => product.barcode === barcode))

    setForm((current) => ({ ...current, barcode }))
    setBarcodeFeedback('Kode barcode berhasil dibuat.')
    setShowBarcodePhotoOptions(false)
  }

  const captureCameraPhoto = async () => {
    const video = cameraVideoRef.current
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraError('Kamera belum siap. Tunggu sebentar lalu coba lagi.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL('image/jpeg', 0.9)

    if (cameraMode === 'product') {
      setProductImage(imageData)
      setImageFeedback('Foto produk berhasil diambil dari kamera.')
      setCameraMode('')
      return
    }

    setBarcodeImage(imageData)
    setBarcodeFeedback('Foto barcode tersimpan.')
    setCameraMode('')
  }

  const resetForm = () => {
    setForm({
      ...defaultForm,
      category: availableCategories[0] || '__new_category__',
    })
    setProductImage('')
    setBarcodeImage('')
    setFormError('')
    setImageFeedback('')
    setBarcodeFeedback('')
    setShowBarcodePhotoOptions(false)
    setEditingProductId('')
    setIsProductFormOpen(false)
    setCameraMode('')
  }

  const openNewProductForm = () => {
    resetForm()
    setIsProductFormOpen(true)
  }

  const startEditingProduct = (product) => {
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      newCategory: '',
      purchasePrice: product.purchasePrice ?? '',
      price: product.price,
      bulkPrice: product.bulkPrice ?? '',
      bulkUnit: product.bulkUnit || '',
      unit: 'Satuan',
      stock: product.stock,
      description: product.description || '',
      barcode: product.barcode || '',
    })
    setProductImage(product.image || '')
    setBarcodeImage(product.barcodeImage || '')
    setFormError('')
    setProductActionError('')
    setImageFeedback('')
    setBarcodeFeedback('')
    setShowBarcodePhotoOptions(false)
    setIsProductFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = form.name.trim()
    const purchasePrice = Number(form.purchasePrice)
    const price = Number(form.price)
    const bulkPrice = form.bulkPrice === '' ? null : Number(form.bulkPrice)
    const stock = Number(form.stock)
    const productCategory = form.category === '__new_category__' ? form.newCategory.trim() : form.category
    const barcode = form.barcode.trim()

    if (!name) {
      setFormError('Nama produk wajib diisi.')
      return
    }
    if (!productCategory) {
      setFormError('Pilih kategori atau masukkan nama kategori baru.')
      return
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0 || form.purchasePrice === '') {
      setFormError('Harga beli wajib diisi dan tidak boleh kurang dari Rp0.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Harga jual wajib lebih dari Rp0.')
      return
    }
    if (form.bulkUnit && (!Number.isFinite(bulkPrice) || bulkPrice <= 0)) {
      setFormError('Harga perbanyakan wajib lebih dari Rp0.')
      return
    }
    if (!form.bulkUnit && form.bulkPrice !== '') {
      setFormError('Pilih jenis perbanyakan untuk harga tersebut.')
      return
    }
    if (!Number.isFinite(stock) || stock < 0 || form.stock === '') {
      setFormError('Jumlah stok wajib diisi dan tidak boleh kurang dari 0.')
      return
    }
    if (barcode && productList.some((product) => product.id !== editingProductId && product.barcode === barcode)) {
      setFormError('Barcode tersebut sudah digunakan produk lain.')
      return
    }

    let id = editingProductId
    if (!id) {
      let idNumber = Date.now()
      id = `BRG-${String(idNumber).slice(-6)}`
      while (productList.some((product) => product.id === id)) {
        idNumber += 1
        id = `BRG-${String(idNumber).slice(-6)}`
      }
    }

    setIsSavingProduct(true)
    try {
      const product = {
        id,
        name,
        category: productCategory,
        purchasePrice,
        price,
        bulkPrice: form.bulkUnit ? bulkPrice : null,
        bulkUnit: form.bulkUnit || null,
        unit: 'Satuan',
        stock,
        image: productImage,
        description: form.description.trim(),
        barcode,
        barcodeImage,
      }
      if (editingProductId) {
        await onUpdateProduct(product)
      } else {
        await onAddProduct(product)
      }
      resetForm()
    } catch (error) {
      setFormError(`Produk gagal ${editingProductId ? 'diperbarui' : 'disimpan'}: ${error.message}`)
    } finally {
      setIsSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return

    setProductActionError('')
    try {
      await onDeleteProduct(product.id)
      if (editingProductId === product.id) resetForm()
    } catch (error) {
      setProductActionError(`Produk ${product.name} gagal dihapus: ${error.message}`)
    }
  }

  if (activePage !== 'Barang & Stok') {
    return (
      <section className="w-full min-w-0 max-w-[1060px]">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
            <Icon name={selectedIcon} size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activePage}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kelola {activePage.toLowerCase()} Toko Sumber Rezeki dengan mudah.</p>
          </div>
        </div>
        <div className="mt-4 flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Icon name={selectedIcon} size={24} />
          <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Halaman {activePage}</h3>
          <p className="mt-2 max-w-md text-xs leading-6 text-slate-500 dark:text-slate-400">Data akan ditampilkan di sini. Mulai transaksi dari halaman kasir untuk melihat aktivitas toko.</p>
          <button type="button" onClick={onBackToCashier} className="mt-5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-300">Kembali ke kasir</button>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-[1060px]">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
          <Icon name={selectedIcon} size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activePage}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kelola {activePage.toLowerCase()} Toko Sumber Rezeki dengan mudah.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total produk</span>
          <strong className="mt-2 block text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.totalProducts}</strong>
          <small className="mt-1 block text-[10px] text-slate-400">Produk terdaftar</small>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total stok</span>
          <strong className="mt-2 block text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.totalStock}</strong>
          <small className="mt-1 block text-[10px] text-slate-400">Barang tersedia</small>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Stok menipis</span>
          <strong className="mt-2 block text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.lowStock}</strong>
          <small className="mt-1 block text-[10px] text-slate-400">Produk dengan stok 1–10</small>
        </div>
      </div>

      <div className="mt-4">
        {isProductFormOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl min-w-0 overflow-y-auto rounded-2xl border border-white/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
            <h3 id="product-form-title" className="text-base font-semibold text-slate-800 dark:text-slate-100">{editingProductId ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Atur harga jual satuan dan harga khusus pembelian beberapa barang.</p>
            </div>
            <button type="button" disabled={isSavingProduct} onClick={resetForm} aria-label="Tutup formulir produk" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="grid min-w-0 gap-3">
            <label className={labelClassName}>
              Nama produk
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Contoh: Kopi Bubuk" className={fieldClassName} required />
            </label>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className={labelClassName}>
                Harga beli (Rp)
                <input type="number" min="0" step="1" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} placeholder="10000" className={fieldClassName} required />
              </label>
              <label className={labelClassName}>
                Jumlah stok
                <input type="number" min="0" step="1" name="stock" value={form.stock} onChange={handleChange} placeholder="25" className={fieldClassName} required />
              </label>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className={labelClassName}>
                Harga jual per satuan (Rp)
                <input type="number" min="1" step="1" name="price" value={form.price} onChange={handleChange} placeholder="15000" className={fieldClassName} required />
              </label>
              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="bulk-unit" className={labelClassName}>Harga jual banyak</label>
                <select
                  id="bulk-unit"
                  name="bulkUnit"
                  value={form.bulkUnit}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, bulkUnit: event.target.value, bulkPrice: '' }))
                    setFormError('')
                  }}
                  className={fieldClassName}
                >
                  <option value="">Pilih jenis harga banyak</option>
                  <option value="Lusin">Lusin</option>
                  <option value="Setengah Lusin">Setengah Lusin</option>
                  <option value="Kodi">Kodi</option>
                  <option value="Setengah Kodi">Setengah Kodi</option>
                  <option value="Pack">Pack</option>
                  <option value="Kotak">Kotak</option>
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="bulkPrice"
                  value={form.bulkPrice}
                  onChange={handleChange}
                  placeholder={form.bulkUnit ? `Harga ${form.bulkUnit}` : 'Pilih jenis harga banyak dahulu'}
                  aria-label="Harga jual banyak dalam rupiah"
                  className={fieldClassName}
                  disabled={!form.bulkUnit}
                  required={Boolean(form.bulkUnit)}
                />
              </div>
            </div>

            <div className={`rounded-xl px-3 py-2 text-xs ${expectedProfit < 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>
              Perkiraan untung kotor: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expectedProfit)}</strong> per satuan
            </div>

            <label className={labelClassName}>
              Kategori
              <select name="category" value={form.category} onChange={handleChange} className={fieldClassName}>
                {availableCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                <option value="__new_category__">+ Tambah kategori baru</option>
              </select>
            </label>

            {form.category === '__new_category__' && (
              <label className={labelClassName}>
                Nama kategori baru
                <input type="text" name="newCategory" value={form.newCategory} onChange={handleChange} placeholder="Contoh: Cemilan" className={fieldClassName} required />
              </label>
            )}

            <label className={labelClassName}>
              Deskripsi
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Catatan atau keterangan produk (opsional)" className={`${fieldClassName} resize-y`} />
            </label>

            <div className="grid gap-2">
              <span className={labelClassName}>Foto produk</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-300">
                  {productImage
                    ? <ProductThumbnail image={productImage} name={form.name || 'Produk'} className="h-full w-full object-cover" />
                    : <span>Pratinjau</span>}
                </div>
                <div className="grid min-w-0 flex-1 gap-2">
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleProductImage} className="hidden" />
                  <button type="button" onClick={() => openCamera('product')} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
                    Kamera
                  </button>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
                    Galeri
                  </button>
                </div>
              </div>
              {imageFeedback && <p role="status" className="text-[11px] text-slate-500 dark:text-slate-400">{imageFeedback}</p>}
            </div>

            <section className="grid min-w-0 gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70" aria-labelledby="barcode-title">
              <div>
                <h4 id="barcode-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">Barcode</h4>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Ketik kode atau pindai menggunakan kamera.</p>
              </div>
              <input ref={barcodeGalleryInputRef} type="file" accept="image/*" onChange={handleBarcodeImage} className="hidden" />
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-blue-900/40">
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    placeholder="Contoh: KW-483920"
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                    aria-label="Kode barcode"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBarcodePhotoOptions((visible) => !visible)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"
                    aria-label="Pilih foto barcode dari galeri atau kamera"
                    aria-expanded={showBarcodePhotoOptions}
                  >
                    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3" />
                      <path d="M8 8v8m2-8v8m3-8v8m2-8v8" />
                    </svg>
                  </button>
                  {showBarcodePhotoOptions && (
                    <div className="absolute right-0 top-full z-10 mt-2 grid min-w-44 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <button type="button" onClick={() => { setShowBarcodePhotoOptions(false); openCamera('barcode') }} className="rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Foto dengan kamera</button>
                      <button type="button" onClick={() => { setShowBarcodePhotoOptions(false); barcodeGalleryInputRef.current?.click() }} className="rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Pilih dari galeri</button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={generateBarcode} className="shrink-0 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:min-w-28">
                  Generate
                </button>
              </div>
              {barcodeFeedback && <p role="status" className="text-[11px] text-slate-500 dark:text-slate-400">{barcodeFeedback}</p>}
              {barcodeImage && <img src={barcodeImage} alt="Pratinjau foto barcode" className="h-16 max-w-full rounded-xl border border-slate-200 bg-white object-contain p-1 dark:border-slate-700 dark:bg-slate-900" />}
            </section>
          </div>

          {formError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={isSavingProduct} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
              {isSavingProduct ? 'Menyimpan...' : editingProductId ? 'Simpan perubahan' : 'Simpan produk'}
            </button>
            <button type="button" disabled={isSavingProduct} onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Batal
            </button>
          </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Daftar Produk</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{productList.length} item</span>
              <button type="button" onClick={openNewProductForm} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800">
                + Tambah produk
              </button>
            </div>
          </div>

          {productActionError && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{productActionError}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            {visibleProducts.map((product) => {
              const profit = Number(product.price || 0) - Number(product.purchasePrice || 0)
              const outOfStock = Number(product.stock) <= 0
              const lowStock = Number(product.stock) > 0 && Number(product.stock) <= 10

              return (
                <div key={product.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${outOfStock ? 'border-slate-200 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-800' : lowStock ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                  <ProductThumbnail image={product.image} name={product.name} className={`h-14 w-14 shrink-0 rounded-xl object-cover ${outOfStock ? 'grayscale' : ''}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`truncate text-sm font-semibold ${outOfStock ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{product.name}</p>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{product.category}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{product.id}{product.barcode ? ` · Barcode ${product.barcode}` : ''}</span>
                      <span className={outOfStock ? 'rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300' : lowStock ? 'rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300' : ''}>
                        {outOfStock ? 'Stok habis' : lowStock ? `Stok menipis: ${product.stock} ${product.unit || 'Satuan'}` : `Stok: ${product.stock} ${product.unit || 'Satuan'}`}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[11px]">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}</span>
                      <span className="text-slate-500 dark:text-slate-400">per satuan</span>
                      {product.bulkPrice != null && product.bulkUnit && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {product.bulkUnit}: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.bulkPrice)}
                        </span>
                      )}
                      {product.purchasePrice !== undefined && product.purchasePrice !== null && (
                        <span className={profit < 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}>
                          Untung: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(profit)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => startEditingProduct(product)}
                      className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
                      aria-label={`Edit ${product.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product)}
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                      aria-label={`Hapus ${product.name}`}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {pageCount > 1 && (
            <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800" aria-label="Halaman daftar produk">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan {currentPage * productsPerPage + 1}–{Math.min((currentPage + 1) * productsPerPage, productList.length)} dari {productList.length} produk
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setProductPage(Math.max(0, currentPage - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sebelumnya
                </button>
                <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {currentPage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setProductPage(Math.min(pageCount - 1, currentPage + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Berikutnya
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
      {cameraMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="camera-dialog-title">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="camera-dialog-title" className="text-base font-semibold text-slate-900 dark:text-white">
                {cameraMode === 'product' ? 'Foto Produk' : 'Foto Barcode'}
              </h3>
              <button type="button" onClick={() => setCameraMode('')} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Tutup
              </button>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-slate-950">
              <video ref={cameraVideoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              {cameraMode === 'barcode' && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="h-1/3 w-4/5 rounded-xl border-2 border-blue-400 shadow-[0_0_0_999px_rgba(15,23,42,0.2)]" />
                </div>
              )}
            </div>
            {cameraError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{cameraError}</p>}
            {cameraMode === 'barcode' && !cameraError && (
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Arahkan barcode ke dalam bingkai. Kode akan terisi otomatis saat berhasil terbaca.
              </p>
            )}
            <div className="mt-3 flex justify-end">
              {cameraMode === 'product' && (
                <button type="button" onClick={captureCameraPhoto} disabled={!cameraReady} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  Ambil Foto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
