const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

// First word of the name that contains a letter or number, in any language.
function firstWord(name) {
  return (
    String(name || '')
      .trim()
      .split(/\s+/)
      .find(word => /[\p{L}\p{N}]/u.test(word)) || ''
  )
}

// First letter of the first word, in any script (Latin, Arabic, Chinese...).
// Uses grapheme segmentation so letters with marks stay whole.
export function companyInitial(name) {
  const word = firstWord(name).replace(/^[^\p{L}\p{N}]+/u, '')

  const first = segmenter
    ? [...segmenter.segment(word)][0]?.segment
    : Array.from(word)[0]

  return first ? first.toLocaleUpperCase() : '?'
}

// Every company gets the same colour every time, picked from its first word.
// All of these keep white text readable.
const COLORS = ['#8f000d', '#6e1b1b', '#28664e', '#1f4e79', '#6a3d7c', '#8a5a12']

export function companyColor(name) {
  const word = firstWord(name)
  let hash = 0

  for (const char of word) {
    hash = (hash * 31 + char.codePointAt(0)) % 100003
  }

  return COLORS[hash % COLORS.length]
}