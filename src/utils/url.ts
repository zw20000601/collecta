const TRAILING_PUNCTUATION = /[，。；、,.;)\]}>]+$/g

function cleanupUrlCandidate(candidate: string) {
  return candidate.trim().replace(TRAILING_PUNCTUATION, '')
}

function extractUrlCandidate(raw: string) {
  const text = raw.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''

  // 1) Standard URL with protocol
  const protocolMatch = text.match(/https?:\/\/[^\s"'<>]+/i)
  if (protocolMatch?.[0]) return cleanupUrlCandidate(protocolMatch[0])

  // 2) Protocol-relative URL
  const protocolRelativeMatch = text.match(/\/\/[^\s"'<>]+/)
  if (protocolRelativeMatch?.[0]) return cleanupUrlCandidate(protocolRelativeMatch[0])

  // 3) Bare domain/path (common in shared cloud links)
  const domainLikeMatch = text.match(/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?/)
  if (domainLikeMatch?.[0]) return cleanupUrlCandidate(domainLikeMatch[0])

  // 4) Fallback: first token
  return cleanupUrlCandidate(text.split(' ')[0] || '')
}

export function normalizeExternalUrl(rawUrl?: string | null) {
  const candidate = extractUrlCandidate(String(rawUrl || ''))
  if (!candidate) return ''

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) return candidate
  if (candidate.startsWith('//')) return `https:${candidate}`
  return `https://${candidate}`
}
