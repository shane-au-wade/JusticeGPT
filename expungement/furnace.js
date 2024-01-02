const chokidar = require('chokidar')
const fs = require('fs')
const path = require('path')

const BASE_DIR = path.dirname(__filename)

// Init Open AI API Client
const { OPENAI_API_KEY } = require('./config')
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
})

const HEADER = String.raw`
           __           __  _           __________  ______
          / /_  _______/ /_(_)_______  / ____/ __ \/_  __/
     __  / / / / / ___/ __/ / ___/ _ \/ / __/ /_/ / / /   
    / /_/ / /_/ (__  ) /_/ / /__/  __/ /_/ / ____/ / /    
    \____/\__,_/____/\__/_/\___/\___/\____/_/     /_/     
                                                           
`

// define output dir
const OUTPUT_DIR = path.join(BASE_DIR, 'output')

try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR)
  }
} catch (err) {
  console.error(err)
}

// Define the input directory path
const FURNACE = 'furnace'
const FURNACE_DIR = path.join(BASE_DIR, FURNACE)

// INIT PRINT
console.log(HEADER)
console.log(`\n Using OpenAI api key => ${OPENAI_API_KEY}`)
console.log(`\n Using input dir => ${FURNACE_DIR}\n`)

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

const INIT_STATE = {
  case_id: null,
  case_path: null,
  text: [],

  attorney: {
    name: '',
    bar_number: '',
    firm_name: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
    fax: '',
    email: '',
  },

  court: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },

  defendant_name: '',
  case_title: '',
  date_of_conviction: '',
  court_house_location: '',
  charges: [],
  is_misdemeanor: false,
  is_felony: false,
  is_on_probation: false,
  probation_status: '',
  is_expungement_eligible: false,
}

async function generateCr181(state, output_path) {
  const pdfjsLib = await import('pdfjs-dist')

  let pdf = await pdfjsLib.getDocument('./forms/cr181.pdf').promise

  // Mapping the form field ids to the corresponding values from the client information
  const form_data = {
    '350R': state.case_id,
    '338R': state.attorney.bar_number,
    '339R': state.attorney.name,
    '340R': state.attorney.firm_name,
    '341R': state.attorney.street,
    '342R': state.attorney.city,
    '344R': state.attorney.zip,
    '343R': state.attorney.bar_state,
    '345R': state.attorney.phone,
    '346R': state.attorney.fax,
    '347R': state.attorney.email,
    '348R': state.attorney.attorney_for,
    '335R': state.court.street, // street address
    '334R': state.court.county, // superior court of ...
    '336R': state.court.street, // mailing address
    '337R': `${state.court.city}, ${state.court.state} ${state.court.zip}`,
    '333R': state.defendant_name,
  }

  for ([key, value] of Object.entries(form_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

  let updated_pdf_bytes = await pdf.saveDocument()

  fs.writeFileSync(output_path, updated_pdf_bytes)
}

async function generateAttorneyJson(text) {
  const attorney_json = {
    name: 'Joshua Curtis Wade',
    bar_number: '310028',
    bar_state: 'CA',
    firm_name: 'The Law Office of Joshua C Wade',
    street: '2816 Honolulu Ave #404',
    city: 'Verdugo City',
    zip: '91046',
    phone: '818-823-7705',
    fax: '',
    email: 'joshua.c.wade@gmail.com',
  }

  return attorney_json
}

async function generateCaseJson(text) {
  info(`generating structured json from case text. This may take a few seconds...`)
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract:\n\ndefendant_name, \ndate_of_conviction,\ncourt_house_location\ncharges: Array<{\ncount,\ncharge_statute ,\nplea,\nlast_disposition,\nis_conviction\n}> ,\nis_misdemeanor, \nis_felony,\nis_on_probation,\nprobation_status,\nis_expungement_eligible,\n\nNote that if the probation status is terminated, then the case is eligible for expungement\n\nOnly included charges with a conviction.\n\nOutput the data as a JSON Object',
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 1,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })
  const generated_json_string = response.choices[0].message.content
  const case_json = JSON.parse(generated_json_string)
  return case_json
}

async function generateCourtJson(text, name) {
  info(`generating structured json from courthouse text. This may take a few seconds...`)
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract a courthouse address, given a specific courthouse name:\n\nstreet,\ncity,\nstate,\nzip,\ncounty,\n\nOutput the data as a JSON Object\n\nCourthouse Info\n\n ${text}`,
      },
      {
        role: 'user',
        content: `generate the address for ${name}`,
      },
    ],
    temperature: 1,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })
  const generated_json_string = response.choices[0].message.content
  const court_json = JSON.parse(generated_json_string)
  return court_json
}

// Function to handle a new case folder
async function handleNewCase(case_id, case_path) {
  const state = INIT_STATE
  state.case_path = case_path
  state.case_id = case_id

  const case_output_dir = path.join(OUTPUT_DIR, case_id)

  info(`case output => ${case_output_dir}`)

  state.filenames = fs.readdirSync(case_path)

  state.filenames.forEach((filename) => info(` |_ ${filename}`))

  const pdfjsLib = await import('pdfjs-dist')

  for (const filename of state.filenames) {
    // load pdf text into state.text
    if (filename.includes('.pdf')) {
      const pdf_path = path.join(state.case_path, filename)
      const pdf = await pdfjsLib.getDocument(pdf_path).promise

      // const metadata = await pdf.getMetadata()

      const pdf_text = await getPdfText(pdf)
      const new_text = `Contents of ${filename} for case ${state.case_id}:\n\n${pdf_text}`
      state.text.push(new_text)
      info(`loaded => ${pdf_path}`)
    }

    // load .txt text into state.text
    if (filename.includes('.txt')) {
      const txt_path = path.join(state.case_path, filename)
      const file_text = fs.readFileSync(txt_path)
      const new_text = `Contents of ${filename} for case ${state.case_id}:\n\n${file_text}`
      state.text.push(new_text)
      info(`loaded => ${txt_path}`)
    }
  }

  const combined_text = state.text.join('\n\n\n')

  info(`case text is loaded and ready for processing => ${combined_text.length} chars`)

  const case_json = await generateCaseJson(combined_text)

  info(`case json => \n${JSON.stringify(case_json, null, 2)}}`)

  const {
    defendant_name,
    case_title,
    date_of_conviction,
    court_house_location,
    charges,
    is_misdemeanor,
    is_felony,
    is_on_probation,
    probation_status,
    is_expungement_eligible,
  } = case_json

  state.defendant_name = defendant_name
  state.case_title = case_title
  state.date_of_conviction = date_of_conviction
  state.court_house_location = court_house_location
  state.charges = charges
  state.is_misdemeanor = is_misdemeanor
  state.is_felony = is_felony
  state.is_on_probation = is_on_probation
  state.probation_status = probation_status
  state.is_expungement_eligible = is_expungement_eligible

  // load pdf data from the ./attorney folder
  const bar_pdf_text = ''
  const attorney_json = await generateAttorneyJson(bar_pdf_text)
  const { name, bar_number, firm_name, street, city, zip, phone, fax, email, bar_state } = attorney_json
  state.attorney = {
    name: name,
    bar_number: bar_number,
    bar_state: bar_state,
    firm_name: firm_name,
    street: street,
    city: city,
    zip: zip,
    phone: phone,
    fax: fax,
    email: email,
    attorney_for: state.defendant_name,
  }

  const courthouses_path = path.join(__dirname, 'courthouses')
  const courthouses_files = fs.readdirSync(courthouses_path)
  const courthouses_pdf_path = path.join(courthouses_path, courthouses_files[0])
  const courthouses_pdf = await pdfjsLib.getDocument(courthouses_pdf_path).promise
  const courthouses_pdf_text = await getPdfText(courthouses_pdf)
  const courthouses_text = `Contents of ${courthouses_files[0]} for case ${state.case_id}:\n\n${courthouses_pdf_text}`

  info(`courthouse pdf text loaded => ${courthouses_text.length} chars`)

  const courthouse_json = await generateCourtJson(courthouses_text, state.court_house_location)

  info(`court json => \n${JSON.stringify(courthouse_json, null, 2)}`)

  state.court = {
    county: courthouse_json.county,
    street: courthouse_json.street,
    city: courthouse_json.city,
    state: courthouse_json.state,
    zip: courthouse_json.zip,
  }

  // state.text = ['...']
  // info(`state => \n${JSON.stringify(state, null, 2)}`)

  const cached_state_path = path.join(case_output_dir, 'cached_state.json')
  fs.writeFileSync(cached_state_path, JSON.stringify(state, null, 2))

  if (!state.is_expungement_eligible) return

  info(`Case ${state.case_id} is elligible for expungment. Filling forms...`)

  const cr181_output_path = path.join(case_output_dir, `CR-181_Order_for_Dismissal.pdf`)
  generateCr181(state, cr181_output_path)

  info(`Filled form cr181`)
}

// Initialize watcher
const watcher = chokidar.watch(FURNACE_DIR, {
  ignored: /^\./, // ignore dotfiles
  persistent: true,
  depth: 1, // Only look one level deep
})

watcher.on('ready', () => info('watcher ready'))
watcher.on('error', (error) => console.error(`Watcher error: ${error}`))
watcher.on('addDir', (case_path) => {
  const case_id = path.basename(case_path)
  if (case_id == FURNACE) return

  info(`new case detected: ${case_id}`)
  info(`${case_id}: path => ${case_path}`)

  // ensure the case has an output dir
  const case_output_dir = path.join(OUTPUT_DIR, case_id)
  try {
    if (!fs.existsSync(case_output_dir)) {
      fs.mkdirSync(case_output_dir)
    }
  } catch (err) {
    console.error(err)
  }

  handleNewCase(case_id, case_path)
})

info('Starting Furnace Monitoring Service')
