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

const INFO = 'info: '

/**
 * 
 * @param {String} msg 
 */
function info(msg) {
    // TODO style

}

// Define the input directory path
const inputDir = path.join(__dirname, 'input')

console.log('Input dir', inputDir)

// Initialize watcher.
const watcher = chokidar.watch(inputDir, {
  ignored: /^\./, // ignore dotfiles
  persistent: true,
  depth: 1, // Only look one level deep
})

// Function to handle a new case folder
function handleNewCase(casePath) {
  const caseId = path.basename(casePath)
  console.log(`New case detected: ${caseId}`)

  // Define expected files
  const infoPdfPath = path.join(casePath, 'info.pdf')
  const caseNotesTxtPath = path.join(casePath, 'notes.txt')

  // Check if the required files exist
  if (fs.existsSync(infoPdfPath) && fs.existsSync(caseNotesTxtPath)) {
    console.log(`Found required files for case ${caseId}. Ready to process...`)
    // TODO: Implement processing logic here
  } else {
    console.error(`Missing required files for case ${caseId}.`)
  }
}

watcher
  .on('ready', () => {
    console.log(HEADER)
    console.log('watcher initialized')

    // initialized watcher
    watcher
    .on('error', (error) => console.error(`Watcher error: ${error}`))
    .on('addDir', (path) => handleNewCase(path))
  })

  .on('ready', () => {
    console.log('Initial scan complete. Ready for changes...')
  })

console.log('Starting Input Monitoring Service...')
