import { useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { categories, products } from './data/products'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ProductCatalog } from './components/cashier/ProductCatalog'
import { PaymentPanel } from './components/cashier/PaymentPanel'
import { ModuleContent } from './components/cashier/ModuleContent'
import { CheckoutModal } from './components/cashier/CheckoutModal'
import { Toast } from './components/ui/Toast'
import { Icon } from './assets/icons'
import { SalesReport } from './components/cashier/SalesReport'
import { TransactionHistory } from './components/cashier/TransactionHistory'
import { getSaleLabel, getSalePrice } from './lib/sale'
import {
  createProduct,
  deleteProduct as deleteProductFromSupabase,
  fetchProducts,
  fetchTransactions,
  saveSale,
  supabase,
  supabaseConfigIncomplete,
  supabaseConfigured,
  updateProduct,
} from './lib/supabase'

function App() {
  const [activePage, setActivePage] = useState('Kasir')
  const [category, setCategory] = useState('Semua produk')
  const [search, setSearch] = useState('')
  const [productList, setProductList] = useState(products)
  const [transactions, setTransactions] = useState([])
  const [dataReady, setDataReady] = useState(!supabaseConfigured)
  const [databaseError, setDatabaseError] = useState('')
  const [isSavingTransaction, setIsSavingTransaction] = useState(false)
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [qrisMode, setQrisMode] = useState('tampil')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [successTransaction, setSuccessTransaction] = useState(null)
  const [toast, setToast] = useState('')
  const [clock, setClock] = useState(new Date())
  const searchRef = useRef(null)
  const discountRef = useRef(null)
  const payButtonRef = useRef(null)

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    const loadStoreData = async () => {
      try {
        const [loadedProducts, loadedTransactions] = await Promise.all([
          fetchProducts(),
          fetchTransactions(),
        ])
        if (!active) return
        setProductList(loadedProducts)
        setTransactions(loadedTransactions)
        setDatabaseError('')
      } catch (error) {
        if (active) {
          setProductList([])
          setTransactions([])
          setDatabaseError(`Gagal memuat data Supabase: ${error.message}`)
        }
      } finally {
        if (active) setDataReady(true)
      }
    }

    loadStoreData()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const visibleProducts = useMemo(() => productList.filter((product) => {
    const matchesCategory = category === 'Semua produk' || (category === 'Lainnya' ? false : product.category === category)
    const matchesSearch = `${product.name} ${product.id}`.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [category, search, productList])
  const productCategories = useMemo(() => [
    ...new Set([
      ...categories,
      ...productList.map((product) => product.category).filter(Boolean),
    ]),
  ], [productList])

  const subtotal = cart.reduce((total, item) => total + getSalePrice(item.product, item.saleType) * item.quantity, 0)
  const discountAmount = Math.max(0, Number(discount || 0))
  const discountValue = discountType === 'percent'
    ? Math.min(subtotal, Math.round(subtotal * (Math.min(discountAmount, 100) / 100)))
    : Math.min(subtotal, discountAmount)
  const tax = 0
  const total = subtotal - discountValue
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  const showMessage = (message) => {
    setToast(message)
    window.clearTimeout(showMessage.timeoutId)
    showMessage.timeoutId = window.setTimeout(() => setToast(''), 2600)
  }

  const selectedPaymentMethod = paymentMethod === 'QRIS'
    ? `QRIS (${qrisMode === 'tampil' ? 'Tampilkan QRIS' : 'Scan QRIS'})`
    : paymentMethod

  const handleSelectPayment = (method) => {
    setPaymentMethod(method)
    if (method !== 'QRIS') {
      setQrisMode('tampil')
      return
    }
    setQrisMode('pilih')
  }

  const handleSelectQrisMode = (mode) => {
    setQrisMode(mode)
  }

  const addToCart = (product, saleType = 'unit') => {
    if (product.stock < 1) {
      showMessage('Stok produk sedang habis.')
      return
    }

    setCart((current) => {
      const soldQuantity = current
        .filter((item) => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      const existing = current.find((item) => item.product.id === product.id && item.saleType === saleType)
      if (existing) {
        if (soldQuantity >= product.stock) {
          showMessage('Jumlah produk sudah mencapai batas stok.')
          return current
        }
        return current.map((item) => item.product.id === product.id && item.saleType === saleType ? { ...item, quantity: item.quantity + 1 } : item)
      }
      if (soldQuantity >= product.stock) {
        showMessage('Jumlah produk sudah mencapai batas stok.')
        return current
      }
      return [...current, { product, quantity: 1, saleType }]
    })
  }

  const addBarcodeToCart = (barcode) => {
    const product = productList.find((item) => item.barcode?.trim() === barcode.trim())
    if (!product) {
      showMessage(`Barcode ${barcode} tidak ditemukan.`)
      return
    }
    addToCart(product)
  }

  const addProduct = async (newProduct) => {
    const savedProduct = supabase ? await createProduct(newProduct) : newProduct
    setProductList((current) => [savedProduct, ...current])
    showMessage(`Produk ${newProduct.name} berhasil ditambahkan.`)
  }

  const editProduct = async (updatedProduct) => {
    const savedProduct = supabase ? await updateProduct(updatedProduct) : updatedProduct
    setProductList((current) => current.map((product) => product.id === savedProduct.id ? savedProduct : product))
    const cartItem = cart.find((item) => item.product.id === savedProduct.id)
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== savedProduct.id) return [item]
      if (savedProduct.stock < 1) return []
      return [{ ...item, product: savedProduct, quantity: Math.min(item.quantity, savedProduct.stock) }]
    }))
    if (cartItem && savedProduct.stock < cartItem.quantity) {
      showMessage(savedProduct.stock
        ? `Produk diperbarui. Jumlah ${savedProduct.name} di keranjang disesuaikan dengan stok.`
        : `Produk diperbarui dan ${savedProduct.name} dihapus dari keranjang karena stok habis.`)
    } else {
      showMessage(`Produk ${savedProduct.name} berhasil diperbarui.`)
    }
  }

  const removeProduct = async (productId) => {
    const cleanupError = supabase ? await deleteProductFromSupabase(productId) : ''
    setProductList((current) => current.filter((product) => product.id !== productId))
    setCart((current) => current.filter((item) => item.product.id !== productId))
    showMessage(cleanupError
      ? `Produk berhasil dihapus, tetapi foto produk belum terhapus: ${cleanupError}`
      : 'Produk berhasil dihapus.')
  }

  const completeTransaction = async (cashReceived) => {
    if (!cart.length || isSavingTransaction) return
    if (paymentMethod === 'Tunai' && (!Number.isSafeInteger(cashReceived) || cashReceived < total)) {
      showMessage('Jumlah uang yang diterima kurang dari total pembayaran.')
      return
    }

    const transactionNumber = `TRX-${Date.now()}`
    setIsSavingTransaction(true)
    try {
      const savedItems = cart.map(({ product, quantity, saleType = 'unit' }) => {
        const unitPrice = getSalePrice(product, saleType)
        const label = getSaleLabel(product, saleType)
        return {
          product_id: product.id,
          product_name: saleType === 'bulk' ? `${product.name} (${label})` : product.name,
          quantity,
          unit_price: unitPrice,
          purchase_price: saleType === 'bulk' ? null : product.purchasePrice ?? null,
          line_total: unitPrice * quantity,
          line_profit: saleType === 'bulk' || product.purchasePrice == null
            ? null
            : (unitPrice - product.purchasePrice) * quantity,
        }
      })

      if (supabase) {
        await saveSale({
          transactionNumber,
          paymentMethod,
          discountType,
          discountValue: discountAmount,
          taxEnabled: false,
          items: cart,
        })
      }
      const savedTransaction = {
        id: transactionNumber,
        transaction_number: transactionNumber,
        payment_method: selectedPaymentMethod,
        subtotal,
        discount_amount: discountValue,
        tax_amount: tax,
        total_amount: total,
        created_at: new Date().toISOString(),
        items: savedItems,
      }
      setTransactions((current) => [savedTransaction, ...current])
      setProductList((current) => current.map((product) => {
        const soldQuantity = cart
          .filter((item) => item.product.id === product.id)
          .reduce((sum, item) => sum + item.quantity, 0)
        return soldQuantity ? { ...product, stock: product.stock - soldQuantity } : product
      }))

      setCart([])
      setDiscount('')
      setShowCheckout(false)
      setSuccessTransaction({
        transactionNumber,
        paymentMethod: selectedPaymentMethod,
        total,
        change: paymentMethod === 'Tunai' ? cashReceived - total : null,
      })
      if (supabase) {
        try {
          const [loadedProducts, loadedTransactions] = await Promise.all([
            fetchProducts(),
            fetchTransactions(),
          ])
          setProductList(loadedProducts)
          setTransactions(loadedTransactions)
          setDatabaseError('')
        } catch (error) {
          setDatabaseError(`Transaksi berhasil disimpan, tetapi data terbaru gagal dimuat: ${error.message}`)
        }
      }
    } catch (error) {
      showMessage(`Transaksi gagal disimpan: ${error.message}`)
    } finally {
      setIsSavingTransaction(false)
    }
  }

  const handleOpenCheckout = () => {
    if (paymentMethod === 'QRIS') setQrisMode('pilih')
    setShowCheckout(true)
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === 'F2') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'F7') {
        event.preventDefault()
        discountRef.current?.focus()
      }
      if (event.key === 'F9') {
        event.preventDefault()
        if (cart.length) payButtonRef.current?.click()
      }
      if (event.key === 'Escape') {
        setShowCheckout(false)
        setSuccessTransaction(null)
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [cart.length])

  if (supabaseConfigured && !dataReady) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">Memuat produk dan transaksi...</div>
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50/70 to-amber-50/50 text-slate-800 transition-colors duration-200 dark:from-[#071426] dark:via-[#0b1e3d] dark:to-[#102b55] dark:text-slate-50">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar
            activePage={activePage}
            isCollapsed={isCollapsed}
            isDark={isDark}
            isMobileOpen={isMobileSidebarOpen}
            onToggleSidebar={() => setIsCollapsed((value) => !value)}
            onToggleTheme={() => setIsDark((value) => !value)}
            onSelectPage={(page) => setActivePage(page)}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1800px] flex-1 p-4 md:p-6 xl:p-8">
            <TopBar
              activePage={activePage}
              clock={clock}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen((value) => !value)}
            />

            {!supabaseConfigured && (
              <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {supabaseConfigIncomplete
                  ? <>Konfigurasi Supabase belum lengkap. Lengkapi URL dan anon key di <code>.env.local</code>. Aplikasi saat ini berjalan dalam mode sementara; data tidak tersinkron.</>
                  : <>Supabase belum dikonfigurasi. Aplikasi berjalan dalam mode demo; data produk, stok, dan transaksi hanya tersimpan sementara di memori.</>}
              </div>
            )}
            {databaseError && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {databaseError}
              </div>
            )}
            {activePage === 'Kasir' ? (
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <ProductCatalog
                    category={category}
                    search={search}
                    searchRef={searchRef}
                    onSetCategory={setCategory}
                    onSetSearch={setSearch}
                    visibleProducts={visibleProducts}
                    categories={productCategories}
                    onAddToCart={addToCart}
                    onScanBarcode={addBarcodeToCart}
                    onManageProducts={() => setActivePage('Barang & Stok')}
                  />
                </div>

                <PaymentPanel
                  cart={cart}
                  onSetCart={setCart}
                  discount={discount}
                  onSetDiscount={setDiscount}
                  discountType={discountType}
                  onSetDiscountType={setDiscountType}
                  paymentMethod={paymentMethod}
                  onSelectPayment={handleSelectPayment}
                  itemCount={itemCount}
                  subtotal={subtotal}
                  discountValue={discountValue}
                  total={total}
                  isSaving={isSavingTransaction}
                  payButtonRef={payButtonRef}
                  onOpenCheckout={handleOpenCheckout}
                  onClearCart={() => {
                    setCart([])
                    setDiscount('')
                    showMessage('Keranjang telah dikosongkan.')
                  }}
                  discountRef={discountRef}
                />
              </div>
            ) : activePage === 'Riwayat Transaksi' ? (
              <TransactionHistory transactions={transactions} />
            ) : activePage === 'Laporan' ? (
              <SalesReport transactions={transactions} />
            ) : (
              <ModuleContent
                activePage={activePage}
                productList={productList}
                categories={productCategories}
                onAddProduct={addProduct}
                onUpdateProduct={editProduct}
                onDeleteProduct={removeProduct}
                onBackToCashier={() => setActivePage('Kasir')}
              />
            )}
          </main>
        </div>

        {showCheckout && (
          <CheckoutModal
            itemCount={itemCount}
            paymentMethod={paymentMethod}
            qrisMode={qrisMode}
            onSelectQrisMode={handleSelectQrisMode}
            total={total}
            onClose={() => setShowCheckout(false)}
            onComplete={completeTransaction}
            isSaving={isSavingTransaction}
          />
        )}

        {successTransaction && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Icon name="check" size={30} />
              </div>
              <h2 id="payment-success-title" className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Pembayaran berhasil</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Transaksi {successTransaction.transactionNumber} berhasil diselesaikan.</p>
              <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Metode pembayaran</span>
                  <strong className="text-right text-slate-800 dark:text-slate-100">{successTransaction.paymentMethod}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Total</span>
                  <strong className="text-blue-700 dark:text-blue-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(successTransaction.total)}</strong>
                </div>
                {successTransaction.change !== null && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Uang kembalian</span>
                    <strong className="text-emerald-700 dark:text-emerald-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(successTransaction.change)}</strong>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="mt-5 h-10 w-full rounded-xl bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800"
                onClick={() => setSuccessTransaction(null)}
              >
                Selesai
              </button>
            </section>
          </div>
        )}

        {toast && <Toast message={toast} />}
      </div>
    </div>
  )
}

export default App
