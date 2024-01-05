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
  is_probation_granted: false,
  probation_status: '',
  is_expungement_eligible: false,
  service_date: '',
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

    // CR-181[0].Page2[0].P2Header[0].CaseNumber2[0]
    '374R': state.case_id,

    // CR-181[0].Page2[0].P2Header[0].Party1[0]
    '375R': state.defendant_name,
  }

  for ([key, value] of Object.entries(form_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

  let updated_pdf_bytes = await pdf.saveDocument()

  fs.writeFileSync(output_path, updated_pdf_bytes)
}

async function generateCr180(state, output_path) {
  const pdfjsLib = await import('pdfjs-dist')
  let pdf = await pdfjsLib.getDocument('./forms/cr180.pdf').promise

  /**
   * Filling the caption on page 1
   */

  // Mapping the form field ids to the corresponding values from the client information
  const caption_data = {
    '325R': state.case_id,
    '308R': state.attorney.bar_number,
    '309R': state.attorney.name,
    '310R': state.attorney.firm_name,
    '311R': state.attorney.street,
    '312R': state.attorney.city,
    '313R': state.attorney.bar_state,
    '314R': state.attorney.zip,
    '315R': state.attorney.phone,
    '316R': state.attorney.fax,
    '317R': state.attorney.email,
    '318R': state.attorney.attorney_for,
    '304R': state.court.county,
    '305R': state.court.street,
    '307R': `${state.court.city}, ${state.court.zip}`,
    '303R': state.defendant_name,

    // CR-180[0].Page2[0].pXCaption[0].Defendant[0]
    '254R': state.defendant_name,
    // CR-180[0].Page2[0].pXCaption[0].CaseNumber1[0]
    '253R': state.case_id,

    // CR-180[0].Page3[0].pXCaption[0].Defendant[0]
    '355R': state.defendant_name,
    // CR-180[0].Page3[0].pXCaption[0].CaseNumber1[0]
    '354R': state.case_id,
  }

  for ([key, value] of Object.entries(caption_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

  /**
   * Filling the conviction table on page 1
   */

  //  CR-180[0].Page1[0].LI1[0].li1[0].ConvictionDate[0],
  const conviction_date_field_id = '267R'
  pdf.annotationStorage.setValue(conviction_date_field_id, { value: state.date_of_conviction })

  // [code, section, type_of_offense, reduce_to_misdeamor, reduce_to_infraction ]
  const conviction_table = [
    ['294R', '295R', '296R', '297R', '298R'],
    ['289R', '290R', '291R', '292R', '293R'],
    ['284R', '285R', '286R', '287R', '288R'],
    ['279R', '280R', '281R', '282R', '283R'],
    ['274R', '275R', '276R', '277R', '278R'],
  ]

  const code_map = {
    PC: 'Penal',
    HS: 'Health&Safety',
    VC: 'Vehicle',
  }

  for (const [conviction_table_row, charge] of Object.entries(state.charges)) {
    const { charge_statute, is_conviction } = charge
    // only process convictions
    if (!is_conviction) continue

    // charge_statute: 'PC243(e)(1)-M'
    // get the first 2 characters
    const _code = charge_statute.slice(0, 2)
    const code = code_map[_code]

    // get the section
    const section = charge_statute.slice(2, charge_statute.lastIndexOf('-'))

    let type_of_offense
    if (charge_statute.at(-1) == 'M') type_of_offense = 'misdemeanor'
    if (charge_statute.at(-1) == 'F') type_of_offense = 'felony'

    const reduce_to_misdemeanor = 'no'
    const reduce_to_infraction = 'no'

    const row_data = [code, section, type_of_offense, reduce_to_misdemeanor, reduce_to_infraction]

    const row_ids = conviction_table[conviction_table_row]

    for (const [index, value] of Object.entries(row_data)) {
      if (!value) continue
      const key = row_ids[index]
      pdf.annotationStorage.setValue(key, { value: value })
    }
  }

  /**
   * Filling checkboxs for section 2
   *
   * this case is a 1203.4
   */

  //'CR-180[0].Page1[0].LI2[0].ProbationGranted[0]'
  const probation_granted_checkbox_id = '258R'

  //CR-180[0].Page1[0].LI2[0].li2a[0].ProbationGrantedReason[0]
  const reason_checkbox_a = '265R'
  const reason_checkbox_b = '264R'
  const reason_checkbox_c = '262R'

  if (state.is_probation_granted && (state.is_misdemeanor || state.is_felony)) {
    info(`Case ${state.case_id} classifeid as => 1203.4 for CR-180 form`)
    pdf.annotationStorage.setValue(probation_granted_checkbox_id, { value: 'On' })

    if (state.probation_status.toLowerCase().includes('terminated')) {
      pdf.annotationStorage.setValue(reason_checkbox_a, { value: 'On' })
    }
  }

  /**
   * Filling checkboxs for section 3
   *
   * this case is a 1203.4a
   *
   * a misdemeanor with a status of probation denied is elligible for
   * a 1203.4a dismissal
   */

  if (state.is_misdemeanor && state.probation_status.toLowerCase().includes('denied')) {
    info(`Case ${state.case_id} classifeid as => 1203.4a for CR-180 form`)
    //CR-180[0].Page2[0].LI3[0].OffenseWSentence[0] checkbox
    pdf.annotationStorage.setValue('247R', { value: 'On' })
    //CR-180[0].Page2[0].LI3[0].li3a[0].ProbationNotGrantedReason[0] checkbox a
    pdf.annotationStorage.setValue('252R', { value: 'On' })
  }

  /**
   * Date and Attorney name
   */

  // CR-180[0].Page3[0].SigDate[0]
  // CR-180[0].Page3[0].SigName[0]

  const name_id = '226R'
  pdf.annotationStorage.setValue(name_id, { value: state.attorney.name })

  const date_id = '339R'
  pdf.annotationStorage.setValue(date_id, { value: state.service_date })

  let updated_pdf_bytes = await pdf.saveDocument()

  fs.writeFileSync(output_path, updated_pdf_bytes)
}

async function generateCr106(state, output_path) {
  const pdfjsLib = await import('pdfjs-dist')

  let pdf = await pdfjsLib.getDocument({
    url: './forms/cr106.pdf',
    verbosity: 0,
  }).promise

  form_data = {
    '231R': `${state.court.county}\n${state.court_house_location}\n${state.court.street}\n${state.court.city}, ${state.court.state} ${state.court.zip}`,
    '232R': state.case_id,
    '203R': state.case_id,
    '233R': state.defendant_name,
    '227R': state.attorney.street,
    '228R': state.attorney.city,
    '229R': state.attorney.bar_state,
    '230R': state.attorney.zip,
    '206R': 'CR-180 + CR-181 + CR-106',
    // checkbox for business address
    '213R': 'On',

    // service by mail fields
    '207R': `${state.court.county} District Attorney's Office`,
    '208R': state.court.street,
    '224R': state.court.city,
    '225R': state.court.state,
    '226R': state.court.zip,

    // date sent
    '217R': state.service_date,
    '218R': state.attorney.city,
    '219R': state.attorney.bar_state,
    // sent with U.S. Postal Service checkbox
    '215R': 'On',

    // CR-106[0].Page2[0].PxCaption[0].CaseNumber[0]
    '203R': state.case_id,

    // sig name
    '185R': state.attorney.name,
    // sig date
    '184R': state.service_date,
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
          'Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract:\n\ndefendant_name, \ndate_of_conviction,\ncourt_house_location,\nis_misdemeanor,\nis_felony,\nis_probation_granted,\nprobation_status,\n\nNote that if the probation status is terminated, then the case is eligible for expungement\n\nOnly included charges with a conviction.\n\nOutput the data as a JSON Object',
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

async function generateChargesJson(text) {
  info(`generating charges json from courthouse text. This may take a few seconds...`)
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract the conviction charges from a case document:\n\ncase_id,\ncharges: Array<{\ncount, charge_statute , \nplea, \nlast_disposition, \nis_conviction\n}>\n\nDefault a value to null if it is empty.\n\nis_conviction is false, if last_disposition is null.\n\nOnly cite the charge statute code, include the -M or -F. \n\nOutput the data as a JSON Object.\n\n',
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
  const charges_json = JSON.parse(generated_json_string)
  return charges_json
}

async function generateCourtJson(text, state) {
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
        content: `generate the address for => ${state.court_house_location}`,
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

async function cleanCaseFiles(case_path, case_output_dir, state) {
  const cached_state_path = path.join(case_output_dir, 'cached_state.json')
  fs.writeFileSync(cached_state_path, JSON.stringify(state, null, 2))

  for (const filename of state.filenames) {
    const file_path = path.join(case_path, filename)
    const new_file_path = path.join(case_output_dir, filename)
    fs.copyFileSync(file_path, new_file_path)
    fs.rmSync(file_path)
  }

  fs.rmdirSync(case_path)

  info(`✨ Cleaned up files for: ${state.case_id}`)
}

// Function to handle a new case folder
async function handleNewCase(case_id, case_path) {
  const state = JSON.parse(JSON.stringify(INIT_STATE))

  state.case_path = case_path
  state.case_id = case_id

  const case_output_dir = path.join(OUTPUT_DIR, case_id)

  info(`case output => ${case_output_dir}`)

  // create service date and use this date for downstream signed dates
  const service_date = new Date()
  service_date.setDate(service_date.getDate() + 1)
  state.service_date = service_date.toLocaleDateString({ timeZone: 'America/Los Angeles' })

  info(`service date => ${state.service_date}`)

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
    is_misdemeanor,
    is_felony,
    is_probation_granted,
    probation_status,
    is_expungement_eligible,
  } = case_json

  state.defendant_name = defendant_name
  state.case_title = case_title
  state.date_of_conviction = date_of_conviction
  state.court_house_location = court_house_location
  state.is_misdemeanor = is_misdemeanor
  state.is_felony = is_felony
  state.is_probation_granted = is_probation_granted
  state.probation_status = probation_status
  state.is_expungement_eligible = is_expungement_eligible

  const charges_json = await generateChargesJson(combined_text)
  info(`charges json => \n${JSON.stringify(charges_json, null, 2)}}`)

  const { charges } = charges_json
  state.charges = charges

  // perform prelimary filtering based on case json
  const _probation_status = state.probation_status.toLowerCase()
  if (_probation_status.includes('diversion') || _probation_status.includes('revoked')) {
    const case_notes = `Case with probation status of => ${_probation_status},\n\ttherefore no further processing is required`

    info(case_notes)

    const case_notes_path = path.join(case_output_dir, 'notes.txt')
    fs.writeFileSync(case_notes_path, case_notes)

    info('Wrote case notes.txt')

    await cleanCaseFiles(case_path, case_output_dir, state)

    return
  }

  const convicted_charges = state.charges.filter((charge) => charge.is_conviction)

  info(`Found ${convicted_charges.length} convicted charges`)

  if (convicted_charges.length == 0) {
    const case_notes = `Case has zero convicted charges,\n\ttherefore no further processing is required`

    info(case_notes)

    const case_notes_path = path.join(case_output_dir, 'notes.txt')
    fs.writeFileSync(case_notes_path, case_notes)

    info('Wrote case notes.txt')

    await cleanCaseFiles(case_path, case_output_dir, state)

    return
  }

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

  const courthouse_json = await generateCourtJson(courthouses_text, state)

  info(`court json => \n${JSON.stringify(courthouse_json, null, 2)}`)

  state.court = {
    county: courthouse_json.county.toUpperCase(),
    street: courthouse_json.street,
    city: courthouse_json.city,
    state: courthouse_json.state,
    zip: courthouse_json.zip,
  }

  info(`Case ${state.case_id} is elligible for expungment. Filling forms...`)

  const cr181_output_path = path.join(case_output_dir, `CR-181_Order_for_Dismissal.pdf`)
  const cr180_output_path = path.join(case_output_dir, `CR-180_Petition_for_Dismissal.pdf`)
  const cr106_output_path = path.join(case_output_dir, `CR-106_Proof_of_Service.pdf`)

  await generateCr181(state, cr181_output_path)
  info(`Filled form CR-181`)

  await generateCr180(state, cr180_output_path)
  info('Filled form CR-180')

  await generateCr106(state, cr106_output_path)
  info('Filled form CR-106')

  info(`Expungement forms complete for case: ${state.case_id}`)

  await cleanCaseFiles(case_path, case_output_dir, state)
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
