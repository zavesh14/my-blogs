export function toDisplayImageUrl(value) {
  const url = String(value || '').trim()
  if (!url) return ''

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/i)
  const idMatch = url.match(/[?&]id=([^&]+)/i)
  const fileId = fileMatch?.[1] || idMatch?.[1]
  return fileId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000` : url
}
