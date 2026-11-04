export function getSalePrice(product, saleType = 'unit') {
  return saleType === 'bulk' ? product.bulkPrice : product.price
}

export function getSaleLabel(product, saleType = 'unit') {
  return saleType === 'bulk' ? product.bulkUnit : 'Satuan'
}
