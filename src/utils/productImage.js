export function getProductImageUrl(image, options = {}) {
  if (!image) return ''

  if (/^(data:|blob:|https?:)/i.test(image)) return image

  const { width = 480, height = 300 } = options
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&h=${height}&q=80`
}
