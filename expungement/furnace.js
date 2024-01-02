const chokidar = require('chokidar')
const fs = require('fs')
const path = require('path')

// Init Open AI API Client
const { OPENAI_API_KEY } = require('./config')
const OpenAI = require('openai')

console.log(OPENAI_API_KEY)

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

async function generateAttorneyJson(text) {
  const attorney_json = {
    name: 'Joshua Curtis Wade',
    bar_number: '310028',
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
        content: `Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract a courthouse address, given a specific courthouse name:\n\nstreet,\ncity,\nstate,\nzip,\n\nOutput the data as a JSON Object\n\nCourthouse Info\n\n ${text}`,
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
  const { name, bar_number, firm_name, street, city, zip, phone, fax, email } = attorney_json
  state.attorney = {
    name: name,
    bar_number: bar_number,
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
    street: courthouse_json.street,
    city: courthouse_json.city,
    state: courthouse_json.state,
    zip: courthouse_json.zip,
  }

  state.text = ['...']
  info(`state => \n${JSON.stringify(state, null, 2)}`)
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

/*
const field_keys = [
  'CR-181[0]',
  'CR-181[0].Page1[0]',
  'CR-181[0].Page1[0].Caption[0]',
  'CR-181[0].Page1[0].Caption[0].HeaderSub[0]',
  'CR-181[0].Page1[0].Caption[0].HeaderSub[0].CaseNumber[0]',
  'CR-181[0].Page1[0].Caption[0].HeaderSub[0].CaseNumber[0].CaseNumber2[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].AttyBarNo[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Name[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].AttyFirm[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Street[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].City[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].State[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Zip[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Phone[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Fax[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].Email[0]',
  'CR-181[0].Page1[0].Caption[0].AttyPartyInfo[0].AttyFor[0]',
  'CR-181[0].Page1[0].Caption[0].CourtInfo[0]',
  'CR-181[0].Page1[0].Caption[0].CourtInfo[0].CrtCounty[0]',
  'CR-181[0].Page1[0].Caption[0].CourtInfo[0].CrtStreet[0]',
  'CR-181[0].Page1[0].Caption[0].CourtInfo[0].CrtMailingAdd[0]',
  'CR-181[0].Page1[0].Caption[0].CourtInfo[0].CrtCityZip[0]',
  'CR-181[0].Page1[0].Caption[0].TitlePartyName[0]',
  'CR-181[0].Page1[0].Caption[0].TitlePartyName[0].Party1[0]',
  'CR-181[0].Page1[0].LI1[0]',
  'CR-181[0].Page1[0].LI1[0].CheckBox19[0]',
  'CR-181[0].Page1[0].LI1[0].li1a[0]',
  'CR-181[0].Page1[0].LI1[0].li1a[0].Reduc17b_cb[0]',
  'CR-181[0].Page1[0].LI1[0].li1b[0]',
  'CR-181[0].Page1[0].LI1[0].li1b[0].Reduc17b_cb[0]',
  'CR-181[0].Page1[0].LI1[0].li1c[0]',
  'CR-181[0].Page1[0].LI1[0].li1c[0].Reduc17b_cb[0]',
  'CR-181[0].Page1[0].LI1[0].li1c[0].OtherSpecify_tf[0]',
  'CR-181[0].Page1[0].LI2[0]',
  'CR-181[0].Page1[0].LI2[0].CheckBox19[0]',
  'CR-181[0].Page1[0].LI2[0].li2a[0]',
  'CR-181[0].Page1[0].LI2[0].li2a[0].DenyPet17b_cb[0]',
  'CR-181[0].Page1[0].LI2[0].li2b[0]',
  'CR-181[0].Page1[0].LI2[0].li2b[0].DenyPet17b_cb[0]',
  'CR-181[0].Page1[0].LI2[0].li2c[0]',
  'CR-181[0].Page1[0].LI2[0].li2c[0].DenyPet17b_cb[0]',
  'CR-181[0].Page1[0].LI2[0].li2c[0].OtherSpecify_tf[0]',
  'CR-181[0].Page1[0].LI3[0]',
  'CR-181[0].Page1[0].LI3[0].petitioner_cb[0]',
  'CR-181[0].Page1[0].LI3[0].GrantsPetThree1203[0]',
  'CR-181[0].Page1[0].LI3[0].GrantsPetThree1203[1]',
  'CR-181[0].Page1[0].LI3[0].GrantsPetThree1203[2]',
  'CR-181[0].Page1[0].LI3[0].GrantsPetThree1203[3]',
  'CR-181[0].Page1[0].LI3[0].GrantsPetThree1203[4]',
  'CR-181[0].Page1[0].LI3[0].DenyPetFour1203[0]',
  'CR-181[0].Page1[0].LI3[0].li3a[0]',
  'CR-181[0].Page1[0].LI3[0].li3a[0].ThreeAllConv[0]',
  'CR-181[0].Page1[0].LI3[0].li3b[0]',
  'CR-181[0].Page1[0].LI3[0].li3b[0].ThreeAllConv[0]',
  'CR-181[0].Page1[0].LI3[0].li3b[0].TextField6[0]',
  'CR-181[0].#pageSet[0]',
  'CR-181[0].#pageSet[0].MPLast[0]',
  'CR-181[0].#pageSet[0].MPLast[0].FooterButtons[0]',
  'CR-181[0].#pageSet[0].MPLast[0].FooterButtons[0].Print[0]',
  'CR-181[0].#pageSet[0].MPLast[0].FooterButtons[0].Save[0]',
  'CR-181[0].#pageSet[0].MPLast[0].FooterButtons[0].Reset[0]',
  'CR-181[0].#pageSet[0].MPLast[0].FooterButtons[0].Warning[0]',
  'CR-181[0].Page2[0]',
  'CR-181[0].Page2[0].P2Header[0]',
  'CR-181[0].Page2[0].P2Header[0].CaseNumber2[0]',
  'CR-181[0].Page2[0].P2Header[0].Party1[0]',
  'CR-181[0].Page2[0].LI4[0]',
  'CR-181[0].Page2[0].LI4[0].petitioner_cb[0]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[0]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[1]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[2]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[3]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[4]',
  'CR-181[0].Page2[0].LI4[0].DenyPetFour1203[5]',
  'CR-181[0].Page2[0].LI4[0].li4a[0]',
  'CR-181[0].Page2[0].LI4[0].li4a[0].FourAllConv[0]',
  'CR-181[0].Page2[0].LI4[0].li4b[0]',
  'CR-181[0].Page2[0].LI4[0].li4b[0].FourAllConv[0]',
  'CR-181[0].Page2[0].LI4[0].li4b[0].TextField6[0]',
  'CR-181[0].Page2[0].LI5[0]',
  'CR-181[0].Page2[0].LI5[0].CheckBox19[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0].li5a1[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0].li5a1[0].Relief[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0].li5a2[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0].li5a2[0].Relief[0]',
  'CR-181[0].Page2[0].LI5[0].li5a[0].LI5a[0].li5a2[0].TextField6[0]',
  'CR-181[0].Page2[0].Signature_dt[0]',
]

// const editable_fields_arr = Object.entries(fields).filter(([key, value]) => {
//   if (value[0].editable && !value[0].hidden) return true
//   return false
// })
// const editable_fields = Object.fromEntries(editable_fields_arr)

// let attorney_fields = Object.entries(fields).filter(([key, value]) => {
//   const isEditable = value[0].editable
//   const isHidden = value[0].hidden
//   if (!isEditable || isHidden) return false
//   if (key.includes('AttyPartyInfo')) return true
//   return false
// })

// let court_fields = Object.entries(fields).filter(([key, value]) => {
//   const isEditable = value[0].editable
//   const isHidden = value[0].hidden
//   if (!isEditable || isHidden) return false
//   if (key.includes('CourtInfo')) return true
//   return false
// })

const pdfjsLib = await import('pdfjs-dist')

let pdf = await pdfjsLib.getDocument('./forms/cr181.pdf').promise

let fields = await pdf.getFieldObjects()

let caption_fields_arr = Object.entries(fields).filter(([key, value]) => {
  const isEditable = value[0].editable
  const isHidden = value[0].hidden
  if (!isEditable || isHidden) return false
  if (key.includes('Caption')) return true
})

let caption_fields = Object.fromEntries(caption_fields_arr)

caption_fields['CR-181[0].Page1[0].Caption[0].HeaderSub[0].CaseNumber[0].CaseNumber2[0]'][0].value = 'This is a test'

let updated_pdf_bytes = await pdf.saveDocument().promise

pdf.annotationStorage.setValue('350R', { value: 'this is a test' })

const necessary_fields = ['CR-181[0].Page1[0].Caption[0].HeaderSub[0].CaseNumber[0].CaseNumber2[0]']

fs.writeFileSync('./output/cr181_filled.pdf', new_t)

function fillCr181Form() {
  const field_keys = {}
}

*/
