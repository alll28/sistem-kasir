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
import { LoginForm } from './components/auth/LoginForm'
import { SalesReport } from './components/cashier/SalesReport'
import { TransactionHistory } from './components/cashier/TransactionHistory'
import {
  createProduct,
  fetchProducts,
  fetchTransactions,
  saveSale,
  signOut,
  supabase,
  supabaseConfigIncomplete,
  supabaseConfigured,
} from './lib/supabase'

function App() {
  const [activePage, setActivePage] = useState('Kasir')
  const [category, setCategory] = useState('Semua produk')
  const [search, setSearch] = useState('')
  const [productList, setProductList] = useState(products)
  const [transactions, setTransactions] = useState([])
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [dataReady, setDataReady] = useState(!supabaseConfigured)
  const [databaseError, setDatabaseError] = useState('')
  const [isSavingTransaction, setIsSavingTransaction] = useState(false)
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [toast, setToast] = useState('')
  const [clock, setClock] = useState(new Date())
  const searchRef = useRef(null)
  const discountRef = useRef(null)

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return
      if (error) setDatabaseError(error.message)
      setSession(data.session)
      setAuthReady(true)
      if (!data.session) setDataReady(true)
    }

    loadSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setDataReady(!nextSession)
      setDatabaseError('')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session) return undefined

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
  }, [session])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

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
        if (cart.length) setShowCheckout(true)
      }
      if (event.key === 'Escape') setShowCheckout(false)
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [cart.length])

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

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const discountAmount = Math.max(0, Number(discount || 0))
  const discountValue = discountType === 'percent'
    ? Math.min(subtotal, Math.round(subtotal * (Math.min(discountAmount, 100) / 100)))
    : Math.min(subtotal, discountAmount)
  const tax = taxEnabled ? Math.round((subtotal - discountValue) * 0.11) : 0
  const total = subtotal - discountValue + tax
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  const showMessage = (message) => {
    setToast(message)
    window.clearTimeout(showMessage.timeoutId)
    showMessage.timeoutId = window.setTimeout(() => setToast(''), 2600)
  }

  const addToCart = (product) => {
    if (product.stock < 1) {
      showMessage('Stok produk sedang habis.')
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          showMessage('Jumlah produk sudah mencapai batas stok.')
          return current
        }
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  const addProduct = async (newProduct) => {
    const savedProduct = supabase ? await createProduct(newProduct) : newProduct
    setProductList((current) => [savedProduct, ...current])
    showMessage(`Produk ${newProduct.name} berhasil ditambahkan.`)
  }

  const completeTransaction = async () => {
    if (!cart.length || isSavingTransaction) return

    const transactionNumber = `TRX-${Date.now()}`
    setIsSavingTransaction(true)
    try {
      if (supabase) {
        await saveSale({
          transactionNumber,
          paymentMethod,
          discountType,
          discountValue: discountAmount,
          taxEnabled,
          items: cart,
        })
        const createdAt = new Date().toISOString()
        const savedTransaction = {
          id: transactionNumber,
          transaction_number: transactionNumber,
          payment_method: paymentMethod,
          subtotal,
          discount_amount: discountValue,
          tax_amount: tax,
          total_amount: total,
          created_at: createdAt,
          items: cart.map(({ product, quantity }) => ({
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: product.price,
            purchase_price: product.purchasePrice ?? null,
            line_total: product.price * quantity,
            line_profit: product.purchasePrice == null ? null : (product.price - product.purchasePrice) * quantity,
          })),
        }
        setTransactions((current) => [savedTransaction, ...current])
        setProductList((current) => current.map((product) => {
          const soldItem = cart.find((item) => item.product.id === product.id)
          return soldItem ? { ...product, stock: product.stock - soldItem.quantity } : product
        }))
      } else {
        const createdAt = new Date().toISOString()
        const savedTransaction = {
          id: transactionNumber,
          transaction_number: transactionNumber,
          payment_method: paymentMethod,
          subtotal,
          discount_amount: discountValue,
          tax_amount: tax,
          total_amount: total,
          created_at: createdAt,
          items: cart.map(({ product, quantity }) => ({
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: product.price,
            purchase_price: product.purchasePrice ?? null,
            line_total: product.price * quantity,
            line_profit: product.purchasePrice == null ? null : (product.price - product.purchasePrice) * quantity,
          })),
        }
        setTransactions((current) => [savedTransaction, ...current])
        setProductList((current) => current.map((product) => {
          const soldItem = cart.find((item) => item.product.id === product.id)
          return soldItem ? { ...product, stock: product.stock - soldItem.quantity } : product
        }))
      }

      setCart([])
      setDiscount('')
      setShowCheckout(false)
      showMessage(`Transaksi ${transactionNumber} berhasil disimpan.`)
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

  const handleLogout = async () => {
    if (supabase) {
      try {
        await signOut()
      } catch (error) {
        showMessage(`Gagal keluar: ${error.message}`)
      }
      return
    }
    showMessage('Sesi kasir tetap aktif.')
  }

  if (supabaseConfigured && !authReady) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">Memeriksa sesi kasir...</div>
  }

  if (supabaseConfigured && !session) {
    return <LoginForm />
  }

  if (supabaseConfigured && !dataReady) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">Memuat produk dan transaksi...</div>
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar
            activePage={activePage}
            isCollapsed={isCollapsed}
            isDark={isDark}
            onToggleSidebar={() => setIsCollapsed((value) => !value)}
            onToggleTheme={() => setIsDark((value) => !value)}
            onSelectPage={(page) => setActivePage(page)}
            onLogout={handleLogout}
          />

          <main className="flex-1 min-w-0 p-4 md:p-5 xl:p-6">
            <TopBar
              activePage={activePage}
              clock={clock}
              onNotify={() => showMessage('Tidak ada notifikasi baru.')}
              onProfileClick={() => showMessage('Anda masuk sebagai kasir.')}
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
                  />
                </div>

                <PaymentPanel
                  cart={cart}
                  onSetCart={setCart}
                  discount={discount}
                  onSetDiscount={setDiscount}
                  discountType={discountType}
                  onSetDiscountType={setDiscountType}
                  taxEnabled={taxEnabled}
                  onToggleTax={() => setTaxEnabled((value) => !value)}
                  paymentMethod={paymentMethod}
                  onSelectPayment={setPaymentMethod}
                  itemCount={itemCount}
                  subtotal={subtotal}
                  discountValue={discountValue}
                  tax={tax}
                  total={total}
                  onOpenCheckout={() => setShowCheckout(true)}
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
                onBackToCashier={() => setActivePage('Kasir')}
              />
            )}
          </main>
        </div>

        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[10px] text-slate-600 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
          <Icon name="keyboard" size={14} />
          <span><b className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">F2</b> Cari</span>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <span><b className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">F7</b> Diskon</span>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <span><b className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">F9</b> Bayar</span>
        </div>

        {showCheckout && (
          <CheckoutModal
            itemCount={itemCount}
            paymentMethod={paymentMethod}
            total={total}
            onClose={() => setShowCheckout(false)}
            onComplete={completeTransaction}
            isSaving={isSavingTransaction}
          />
        )}

        {toast && <Toast message={toast} />}
      </div>
    </div>
  )
}

export default App
