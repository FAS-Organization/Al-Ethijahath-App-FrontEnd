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