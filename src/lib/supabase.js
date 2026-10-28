import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigIncomplete = Boolean(supabaseUrl) !== Boolean(supabaseAnonKey)
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

function throwOnError({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    purchasePrice: row.purchase_price === null ? null : Number(row.purchase_price),
    price: Number(row.price || 0),
    unit: row.unit || 'Satuan',
    stock: Number(row.stock || 0),
    image: row.image || '',
    description: row.description || '',
    barcode: row.barcode || '',
    barcodeImage: row.barcode_image || '',
  }
}

function mapTransaction(row) {
  return {
    id: row.id,
    transaction_number: row.transaction_number,
    payment_method: row.payment_method,
    subtotal: Number(row.subtotal),
    discount_amount: Number(row.discount_amount),
    tax_amount: Number(row.tax_amount),
    total_amount: Number(row.total_amount),
    created_at: row.created_at,
    items: (row.transaction_items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      purchase_price: item.purchase_price === null ? null : Number(item.purchase_price),
      line_total: Number(item.line_total),
      line_profit: item.line_profit === null ? null : Number(item.line_profit),
    })),
  }
}

async function uploadProductImage(image, productId, assetName) {
  if (!image?.startsWith('data:')) return image || null

  const blob = await fetch(image).then((response) => response.blob())
  const path = `${productId}/${assetName}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, blob, { upsert: true, contentType: blob.type })
  if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`)

  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export async function fetchProducts() {
  const data = throwOnError(await supabase.from('products').select('*').order('name'))
  return data.map(mapProduct)
}

export async function createProduct(product) {
  const [image, barcodeImage] = await Promise.all([
    uploadProductImage(product.image, product.id, 'product'),
    uploadProductImage(product.barcodeImage, product.id, 'barcode'),
  ])
  const row = {
    id: product.id,
    name: product.name,
    category: product.category,
    purchase_price: product.purchasePrice,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    image,
    description: product.description,
    barcode: product.barcode || null,
    barcode_image: barcodeImage,
  }
  const data = throwOnError(await supabase.from('products').insert(row).select().single())
  return mapProduct(data)
}

export async function fetchTransactions() {
  const data = throwOnError(await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .order('created_at', { ascending: false }))
  return data.map(mapTransaction)
}

export async function saveSale({ transactionNumber, paymentMethod, discountType, discountValue, taxEnabled, items }) {
  return throwOnError(await supabase.rpc('complete_sale', {
    p_transaction_number: transactionNumber,
    p_payment_method: paymentMethod,
    p_discount_type: discountType,
    p_discount_value: discountValue,
    p_tax_enabled: taxEnabled,
    p_items: items.map(({ product, quantity }) => ({
      product_id: product.id,
      quantity,
    })),
  }))
}

export async function signIn(email, password) {
  return throwOnError(await supabase.auth.signInWithPassword({ email, password }))
}

export async function signOut() {
  return throwOnError(await supabase.auth.signOut())
}
