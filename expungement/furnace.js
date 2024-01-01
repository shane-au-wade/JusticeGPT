const chokidar = require('chokidar')
const fs = require('fs')
const path = require('path')

const HEADER = String.raw`
           __           __  _           __________  ______
          / /_  _______/ /_(_)_______  / ____/ __ \/_  __/
     __  / / / / / ___/ __/ / ___/ _ \/ / __/ /_/ / / /   
    / /_/ / /_/ (__  ) /_/ / /__/  __/ /_/ / ____/ / /    
    \____/\__,_/____/\__/_/\___/\___/\____/_/     /_/     
                                                           
`
console.log(HEADER)

/**
 *
 * @param {*} pdf object from mozilla pdf.js
 */
async function getPdfText(pdf) {
  const documents = []
  // read each page of the pdf

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const textItems = textContent.items.map((item) => item.str)
    documents.push(textItems.join(' '))
  }

  // this data is structured to input into ChromaDB text embeddings
  return documents.join('\n')
}

/**
 *
 * @param {String} msg
 */
function info(msg) {
  // TODO style info
  console.log('INFO:', msg)
}

// Define the input directory path
const inputDir = path.join(__dirname, 'furnace')
console.log(`\n Using => ${inputDir}\n`)

// Initialize watcher.
const watcher = chokidar.watch(inputDir, {
  ignored: /^\./, // ignore dotfiles
  persistent: true,
  depth: 1, // Only look one level deep
})

const INIT_STATE = {
  case_id: null,
  case_path: null,
  filenames: [],
  text: [],
}

// Function to handle a new case folder
async function handleNewCase(case_id, case_path) {
  const state = INIT_STATE
  state.case_path = case_path
  state.case_id = case_id

  state.filenames = fs.readdirSync(case_path)

  state.filenames.forEach((filename) => info(` |_ ${filename}`))

  const pdfjsLib = await import('pdfjs-dist')

  for (const filename of state.filenames) {
    // load pdf text into state.text
    if (filename.includes('.pdf')) {
      const pdf_path = path.join(state.case_path, filename)
      const pdf = await pdfjsLib.getDocument(pdf_path).promise
      console.log('PDF loaded')

      const metadata = await pdf.getMetadata()

      Object.keys(metadata).forEach((key) => {
        console.log(`${key}`)
        console.log(metadata[key])
      })

      const pdf_text = await getPdfText(pdf)
      const new_text = `Contents of ${filename} for case ${state.case_id}:\n\n${pdf_text}`
      state.text.push(new_text)
    }

    // load .txt text into state.text
    if (filename.includes('.txt')) {
      const file_text = fs.readFileSync(path.join(state.case_path, filename))
      const new_text = `Contents of ${filename} for case ${state.case_id}:\n\n${file_text}`
      state.text.push(new_text)
    }
  }

  info('case text is loaded and ready for processing')

  const final_text = state.text.join('\n\n\n')

  info(final_text)
}

watcher.on('ready', () => {
  info('watcher ready')
})

// initialized watcher
watcher.on('error', (error) => console.error(`Watcher error: ${error}`))
watcher.on('addDir', (_path) => {
  const case_id = path.basename(_path)
  if (case_id == 'furnace') return

  info(`new case detected: ${case_id}`)
  info(`${case_id}: path => ${_path}`)
  handleNewCase(case_id, _path)
})

info('Starting Furnace Monitoring Service')
