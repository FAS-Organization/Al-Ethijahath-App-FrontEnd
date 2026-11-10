// Makes the 7 error illustrations from your original Lonely_404.svg.
// Run once from the frontend folder:   node scripts/make-error-svgs.mjs
//
// Input : public/images/error-original.svg   (your untouched Lonely_404.svg)
// Output: public/images/error-<type>.svg     (one per error page)
import fs from 'node:fs'

const INPUT = 'public/images/error-original.svg'
const OUTPUT_DIR = 'public/images'

// Letters/numbers drawn in the same slots as the original 4 0 4.
const SIDE = {
    "5": "M83.8 -3.2C134.1 -3.2 166.9 -33.8 166.9 -77.1C166.9 -116.4 139.5 -144 102.7 -144C81.8 -144 64.8 -134.9 58.3 -122.4H57.2L61.1 -167.9H154.1V-212.9H15L6.9 -99L56.3 -89.3C61.1 -99.3 71.8 -105.4 83.8 -105.4C100.9 -105.4 112.7 -93.6 112.7 -75.4C112.7 -57.4 100.9 -45.7 83.8 -45.7C68.8 -45.7 56.3 -54.7 56.3 -69H1.6C2 -30.4 36.1 -3.2 83.8 -3.2Z",
    "3": "M83.1 -3.2C133.8 -3.2 169.2 -28.9 169.2 -65.4C169.2 -90.7 152.6 -108.6 119.2 -112.4V-113.8C143.8 -116.5 161.7 -132.4 161.7 -155.4C161.7 -190.3 129.5 -215.7 83.7 -215.7C36.8 -215.7 3.2 -188.9 3.2 -151H57C57 -163.6 68.1 -172.4 83.7 -172.4C97.7 -172.4 107.6 -163.9 107.6 -151.8C107.6 -139.3 95.9 -130.4 79.3 -130.4H58.1V-91.5H79.3C97.4 -91.5 109.8 -82.8 109.8 -70.2C109.8 -57.4 99.2 -48.5 83.7 -48.5C67.4 -48.5 55.6 -57 55.6 -69H-0.7C-0.7 -30.4 34.3 -3.2 83.1 -3.2Z",
    "0": "M84.2 -3.4C137.9 -3.4 169.2 -40 169.2 -102.1C169.2 -164.2 137.7 -201.1 84.2 -201.1C30.8 -201.1 -0.8 -164.4 -0.8 -102.1C-0.8 -40 30.8 -3.4 84.2 -3.4ZM84.2 -45.8C64.2 -45.8 53.5 -65.6 53.5 -102.1C53.5 -138.7 64.5 -158.9 84.2 -158.9C104.1 -158.9 115 -138.8 115 -102.1C115 -65.6 104.1 -45.8 84.2 -45.8Z",
    "O": "M84.2 -3.7C131.8 -3.7 169.2 -35 169.2 -93.3C169.2 -151.8 131.8 -183.3 84.2 -183.3C36.5 -183.3 -0.8 -151.8 -0.8 -93.3C-0.8 -35.4 36.5 -3.7 84.2 -3.7ZM84.2 -45C60.8 -45 48.1 -62 48.1 -93.3C48.1 -124.8 60.8 -142 84.2 -142C107.8 -142 120.4 -124.8 120.4 -93.3C120.4 -62 107.8 -45 84.2 -45Z",
    "F": "M11.5 -6H67.6V-76.8H148.1V-121H67.6V-167.6H157V-212.9H11.5Z",
    "Z": "M-0.3 -6H168.5V-51.3H109.9C95.9 -51.3 81.8 -51.3 67.7 -50.6C77.2 -61 86.1 -71.3 93.8 -81.5L168.8 -181.8V-212.9H-0V-167.6H63.3C75.8 -167.6 88.1 -167.6 100.6 -168.2C91.9 -158.6 83.6 -149 76.3 -139.4L-0.3 -37.1Z",
    "N": "M-0.7 -6H50.3V-72.8C50.3 -84.9 49 -105 47.5 -126C56.4 -105.5 63.1 -91.5 74.5 -72.8L115.2 -6H169.2V-189H118.2V-122C118.2 -108.4 119.7 -86.1 121 -67.4C113.5 -88.1 106.1 -102.1 96.9 -117.2L53.3 -189H-0.7Z",
    "!": "M59 -70.7H109.5L113.7 -212.9H54.8ZM84.2 -2.7C102.3 -2.7 114 -13.2 114 -30.3C114 -47.4 102.3 -57.9 84.2 -57.9C66.2 -57.9 54.5 -47.4 54.5 -30.3C54.5 -13.2 66.2 -2.7 84.2 -2.7Z",
  }
const MIDDLE = {
    "F": "M9.5 -3.2H67.1V-75.9H149.8V-121.3H67.1V-169.2H158.9V-215.7H9.5Z",
    "Z": "M9.2 -3.2H159V-43.3H107C94.5 -43.3 82 -43.3 69.5 -42.7C77.9 -52 85.8 -61.1 92.7 -70.2L159.2 -159.1V-186.7H9.4V-146.5H65.6C76.7 -146.5 87.6 -146.5 98.7 -147C91 -138.5 83.6 -130 77.2 -121.5L9.2 -30.8Z",
  }

// null = keep the original shape. [left, middle, right]
const WORDS = {
  not_found: [null, null, null], // 4 0 4
  forbidden: [null, null, '3'], // 4 0 3
  server: ['5', null, '0'], // 5 0 0
  maintenance: ['5', null, '3'], // 5 0 3
  offline: ['O', 'F', 'F'], // OFF
  pending: ['Z', 'Z', 'Z'], // ZZZ
  suspended: ['N', null, '!'], // N0!
}

// The original file hides the digits in Chrome, so give the masks a big area.
// Then change the colours to the site's maroon.
const COLORS = [
  ['stroke="#8c8c8c" d="M-283,84', 'stroke="#d9a9a4" d="M-283,84'], // ground line
  ['#8c8c8c', '#8f000d'],
  ['#b7b7b7', '#d9a9a4'],
  ['#000000', '#6e1b1b'],
  ['#565656', '#6e1b1b'],
  ['#505050', '#6e1b1b'],
  ['#6aa9df', '#b22222'],
  ['#fffefe', '#fffdfd'],
]

const original = fs.readFileSync(INPUT, 'utf8')

const FOUR = original.match(/ d="(M88\.238,-145\.674[^"]*)"/)[1]
const ZERO = original.match(/ d="(M108\.415,-83\.297[^"]*)"/)[1]

const LEFT_TILT = 'matrix(0.875,-0.485,0.485,0.875,27.213,44.85)'
const LEFT_STANDING = 'matrix(0.97,-0.242,0.242,0.97,-11.2,-1.4)'

function build([left, middle, right]) {
  let svg = original

  // 4 appears 4 times: left, left shadow, right, right shadow.
  const parts = svg.split(FOUR)
  const L = left ? SIDE[left] : FOUR
  const R = right ? SIDE[right] : FOUR
  svg = parts[0] + L + parts[1] + L + parts[2] + R + parts[3] + R + parts[4]

  // The left letter lies tipped over and half buried in the original, which
  // only reads well for a "4". Stand it up a little so every letter is readable.
  if (left) svg = svg.split(LEFT_TILT).join(LEFT_STANDING)

  if (middle) svg = svg.split(ZERO).join(MIDDLE[middle])

  svg = svg.replace(
    /<mask id="(i\d)">/g,
    '<mask id="$1" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000">',
  )
  svg = svg
    .split('<rect fill="white" height="100%" width="100%" />')
    .join('<rect fill="white" x="-2000" y="-2000" height="5000" width="5000" />')

  for (const [from, to] of COLORS) svg = svg.split(from).join(to)
  return svg
}

for (const [type, letters] of Object.entries(WORDS)) {
  fs.writeFileSync(`${OUTPUT_DIR}/error-${type}.svg`, build(letters))
  console.log('made error-' + type + '.svg')
}