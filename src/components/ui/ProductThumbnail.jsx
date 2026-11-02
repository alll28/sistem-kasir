import { useState } from 'react'
import { getProductImageUrl } from '../../utils/productImage'

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'
}

export function ProductThumbnail({ image, name, className = '' }) {
  const imageUrl = getProductImageUrl(image)
  const [failedImageUrl, setFailedImageUrl] = useState('')

  if (!imageUrl || failedImageUrl === imageUrl) {
    return (
      <div role="img" className={`grid place-items-center bg-gradient-to-br from-sky-100 via-blue-100 to-amber-100 font-bold text-blue-800 dark:from-slate-700 dark:via-blue-950 dark:to-indigo-950 dark:text-sky-200 ${className}`} aria-label={`Inisial produk ${name}`}>
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      loading="lazy"
      className={className}
      onError={() => setFailedImageUrl(imageUrl)}
    />
  )
}
