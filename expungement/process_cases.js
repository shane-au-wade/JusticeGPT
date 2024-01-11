const fs = require('fs')
const path = require('path')

const { getRawJsonViz } = require('./visualizeRawCaseJson')

// Init Open AI API Client
const { OPENAI_API_KEY } = require('./config')
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
})

// CONSTANTS

const CASES_DIR = '/home/shane/repos/JusticeGPT/cases_9WC00001_9WC00200'

const BASE_DIR = path.dirname(__filename)

const CACHED_CASE_MAP_PATH = path.join(CASES_DIR, 'case_map_cache.json')

const OUTPUT_DIR = path.join(BASE_DIR, 'output')

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

function info(msg) {
  console.log('[INFO]', msg)
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

async function generateCourtJson(text, state) {
  info(`generateCourtJson() called. This may take a few seconds...`)
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

/**
 *
 * @returns     {
 *      caseType: 'Criminal',
 *      securityLevel: 0,
 *      caseInfo: [Array],
 *      events: [Array],
 *      tabs: [Array],
 *      parties: [Array],
 *      relatedCases: [],
 *      historicalDocuments: [],
 *      pastProceedings: [Array],
 *      futureProceedings: [],
 *      registerOfActions: [Array],
 *      otherCriminalInformation: [Object],
 *      documents: [],
 *      crossReferences: [Array],
 *      caseNotes: [],
 *      message: '',
 *      caseNumber: 'CIT9WC00099-01',
 *      caseID: '14901330',
 *      caseUType: 'Criminal',
 *      caseUTypeID: 'CR'
 * }
 */
async function getStateFromCase(case_id, case_json, summary_info) {
  const pdfjsLib = await import('pdfjs-dist')

  const state = JSON.parse(JSON.stringify(INIT_STATE))

  // create service date and use this date for downstream signed dates
  const service_date = new Date()
  service_date.setDate(service_date.getDate() + 1)
  state.service_date = service_date.toLocaleDateString({ timeZone: 'America/Los Angeles' })

  info(`Service date => ${state.service_date}`)

  const { caseInfo, parties, otherCriminalInformation } = case_json
  const { convictions } = summary_info

  // filter the parties for the defendant

  const _defendant = parties.filter((party_member) => {
    if (party_member.partyTypeDescription.includes('Defendant')) return true
    return false
  })[0]

  const case_info = {}

  for (const obj of caseInfo) {
    case_info[obj.key.toLowerCase().replaceAll(' ', '_')] = obj.value
  }

  // console.log(case_info)

  const sentencing = otherCriminalInformation.sentencing[0]

  const first_conviction = convictions[0]

  state.case_id = case_id
  state.defendant_name = _defendant.partyName
  state.case_title = case_info.case_title
  state.charges = convictions
  state.date_of_conviction = first_conviction.lase_disposition
  state.court_house_location = case_info.filing_courthouse

  state.is_misdemeanor = convictions.some((charge) => charge.charge_statute.includes('-M'))
  state.is_felony = convictions.some((charge) => charge.charge_statute.includes('-F'))

  state.is_probation_granted = sentencing.probation.length >= 1

  const probation_info = sentencing.probation[0]

  if (probation_info) {
    state.probation_status = probation_info.statuses.at(-1).status
  }

  if (sentencing.sentenceType.toLowerCase().includes('denied')) {
    state.probation_status = 'DENIED'
  }

  // console.log(state)

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

  console.log(state)

  return state
}

async function main() {
  info(`Processing case in\n\t=> ${CASES_DIR}`)
  info(`Using case_map_cache\n\t=> ${CACHED_CASE_MAP_PATH}`)

  const case_map = JSON.parse(fs.readFileSync(CACHED_CASE_MAP_PATH))
  const case_ids = Object.keys(case_map)

  info(`Found ${case_ids.length} cases`)

  for (const [index, case_id] of case_ids.entries()) {
    const case_output_dir = path.join(OUTPUT_DIR, case_id)

    info(`${index + 1}/${case_ids.length} case ${case_id}`)
    const { is_success, summary_info } = case_map[case_id]

    if (!is_success) continue

    const { convictions } = summary_info

    if (convictions.length == 0) continue

    // ensure the case has an output dir
    if (!fs.existsSync(case_output_dir)) {
      fs.mkdirSync(case_output_dir)
    }

    info(`Found ${convictions.length} conviction(s) for case ${case_id}`)

    // load the raw case json from disk
    const case_json = JSON.parse(fs.readFileSync(path.join(CASES_DIR, `${case_id}.json`)))

    // transform it into our internal state format
    const state = await getStateFromCase(case_id, case_json, summary_info)

    // generate forms
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

    const cached_state_path = path.join(case_output_dir, 'cached_state.json')
    fs.writeFileSync(cached_state_path, JSON.stringify(state, null, 2))

    const case_viz_path = path.join(case_output_dir, `${case_id}.md`)
    const case_markdown = getRawJsonViz(case_json)
    fs.writeFileSync(case_viz_path, case_markdown)

    const raw_case_json_path = path.join(case_output_dir, `${case_id}_raw.json`)
    fs.writeFileSync(raw_case_json_path, JSON.stringify(case_json, null, 2))
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
}
