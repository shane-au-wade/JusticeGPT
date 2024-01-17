import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs'
await import('pdfjs-dist/build/pdf.worker.mjs')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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
 * @returns { {
 * case_id: String
 * case_title: String
 * text: []
 * attorney: {}
 * court: {}
 * defendant_name: String }}
 */
export async function getStateFromCase(case_id, case_json, origin) {
  const state = JSON.parse(JSON.stringify(INIT_STATE))

  // create service date and use this date for downstream signed dates
  const service_date = new Date()
  service_date.setDate(service_date.getDate() + 1)
  state.service_date = service_date.toLocaleDateString({ timeZone: 'America/Los Angeles' })

  // info(`Service date => ${state.service_date}`)

  const { caseInfo, parties, otherCriminalInformation, summary_info } = case_json
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

  if (first_conviction) {
    if (first_conviction.hasOwnProperty('lase_disposition')) {
      state.date_of_conviction = first_conviction.lase_disposition
    }
    if (first_conviction.hasOwnProperty('last_disposition')) {
      state.date_of_conviction = first_conviction.last_disposition
    }
  }

  state.case_id = case_id
  state.defendant_name = _defendant.partyName
  state.case_title = case_info.case_title
  state.charges = convictions
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

  const courthouse_file = 'courthouses/Courthouses_in_Los_Angeles_County_Contacts_and_Locations_LA_Court.pdf'

  const pdf_res = await fetch(
    `${origin}/courthouses/Courthouses_in_Los_Angeles_County_Contacts_and_Locations_LA_Court.pdf`
  )
  const courthouses_pdf = await pdfjsLib.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

  const courthouses_pdf_text = await getPdfText(courthouses_pdf)
  const courthouses_text = `Contents of ${courthouse_file} for case ${state.case_id}:\n\n${courthouses_pdf_text}`

  // info(`courthouse pdf text loaded => ${courthouses_text.length} chars`)

  const courthouse_json = await generateCourtJson(courthouses_text, state)

  // info(`court json => \n${JSON.stringify(courthouse_json, null, 2)}`)

  state.court = {
    county: courthouse_json.county.toUpperCase(),
    street: courthouse_json.street,
    city: courthouse_json.city,
    state: courthouse_json.state,
    zip: courthouse_json.zip,
  }

  // console.log(state)

  return state
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
 *      caseUTypeID: 'CR',
 *      info: {}
 * }
 */

export async function getRawCaseJson(case_id) {
  const init_query = await fetch(`https://media.lacourt.org/lascmediaproxy/api/AzureApi/GetCriminalCaseList/${case_id}`)

  if (!init_query.ok) return

  const init_query_json = await init_query.json()

  if (!init_query_json.isSuccess) return

  const init_data = init_query_json.resultList[0]

  const {
    litigationTypeCode, //  'CR',
    caseNumber, // 'CIT9WC00099-01',
    caseID, // '14901330',
    caseTitle,
    caseTypeDescription, // 'Misdemeanor',
    locationName, //West Covina Courthouse',
    litigationTypeDescription, // 'Adult',
    caseSecurityLevel,
    filingDate,
  } = init_data

  const second_query = await fetch(
    `https://media.lacourt.org/lascmediaproxy/api/AzureApi/GetCaseDetailCriminal/${caseNumber}/${caseID} `
  )
  if (!second_query.ok) return

  const second_query_json = await second_query.json()
  if (!second_query_json.isSuccess) return

  const raw_case_json = second_query_json.resultList[0]

  const { otherCriminalInformation } = raw_case_json

  // compute convictions here to simplfy the system

  const _charges = otherCriminalInformation.charges.map((charge) => {
    const {
      countNumber,
      chargeCode,
      statuteName,
      pleaHistoryDisplay,
      lastDispositionDisplay,
      chargeDispositionDateString,
      dispositionCode,
    } = charge

    let _is_conviction = false
    if (dispositionCode && dispositionCode.includes('CON')) _is_conviction = true

    const structured_charge = {
      count: countNumber,
      charge_code: chargeCode,
      charge_statute: statuteName.split(' ')[0],
      plea: pleaHistoryDisplay,
      disply_last_disposition: lastDispositionDisplay,
      last_disposition: chargeDispositionDateString,
      is_conviction: _is_conviction,
    }

    return structured_charge
  })

  const convictions = _charges.filter((charge) => charge.is_conviction)

  raw_case_json.summary_info = {
    case_number: caseNumber,
    case_title: caseTitle,
    case_type: caseTypeDescription,
    courthouse_location: locationName,
    security_level: caseSecurityLevel,
    file_date: filingDate,
    litigation_type: litigationTypeDescription,
    litigation_code: litigationTypeCode,
    convictions: convictions,
  }

  return raw_case_json
}

/**
 * @param {caseType: 'Criminal',
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
 *      caseUTypeID: 'CR'} case_json
 * @returns {VoidFunction}
 */

export function getRawJsonViz(case_json) {
  const {
    parties,
    pastProceedings,
    registerOfActions,
    otherCriminalInformation,
    crossReferences,
    caseNumber,
    caseUTypeID,
    caseUType,
    caseInfo,
  } = case_json

  const { charges, warrants, bondSettings, bonds, sentencing } = otherCriminalInformation

  const _defendant = parties.filter((party_member) => {
    if (party_member.partyTypeDescription.includes('Defendant')) return true
    return false
  })[0]

  const case_info = {}

  for (const obj of caseInfo) {
    case_info[obj.key.toLowerCase().replaceAll(' ', '_')] = obj.value
  }

  // high level case information
  const case_markdown = []

  const high_level_info = `
# Case Information

## ${case_info.case_title}

## ${caseNumber}

**Defendant:** ${_defendant.partyName}

**Defendant ID:** ${case_info.defendant_id}

**Filing Courthouse:** ${case_info.filing_courthouse}

**Arrest Date:** ${case_info.arrest_date}

**Filing Date:** ${case_info.filing_date}
`

  // console.log(high_level_info)
  case_markdown.push(high_level_info)

  const parties_text = `
# Parties Involved

| Role | Name |
| ---- | ----------- |
${parties
  .map((member) => {
    const {
      partyName, // 'The People of the State of California',
      partyTypeDescription, // 'Plaintiff',
      remarks, // '',
      partyID, // '1',
      barNumber, // '',
      partyTypes, // [],
      phoneNumbers, // [],
    } = member

    const party_description = partyTypes
      .map((type) => {
        const { displayText } = type
        return displayText
      })
      .join(', ')

    return `| ${party_description} | ${partyName} |`
  })
  .join('\n')}
`

  case_markdown.push(parties_text)

  const cross_references_text = `
# Cross References

| Type | Type ID | Reference Number | Case ID |
| ---- | --------| ---------------- | ------- |
${crossReferences
  .map((ref) => {
    const {
      caseID, // '17035818',
      number, // '19470',
      typeID, // 'DMVCRT',
      typeDescription, // 'DMV Court Code',
    } = ref

    return `| ${typeDescription} | ${typeID} | ${number} | ${caseID} |`
  })
  .join('\n')}
`

  case_markdown.push(cross_references_text)

  const charges_text_arr = charges.map((charge) => {
    const {
      countNumber, // 001
      chargeCode, // 'VC23152(f)',
      statuteName, // 'VC23152(f)-M Driving Under Influence of Alcohol and Drug',

      pleaHistory, // ['4/10/2019: Pleads Guilty'],
      dispositions, // ['4/10/2019 - Conviction After Plea'],
      pleaHistoryDisplay, // '4/10/2019: Pleads Guilty',
      lastDispositionDisplay, // '4/10/2019 - Conviction After Plea',
      chargeDispositionDate, // '2019-04-10T00:00:00',
      chargeDispositionDateString, // '4/10/2019',
      chargeDisposition, //'Conviction After Plea',
      sentenceDispositionDate, // '1900-01-01T00:00:00',

      dispositionCode, // 'CON',
    } = charge

    return `| ${dispositionCode} | ${countNumber} | ${statuteName} | ${pleaHistoryDisplay} | ${lastDispositionDisplay} |`
  })

  const charges_text = `
# Charges 

| Count | Charge | Status | Plea | Last Disposition |
| ----- | ------ | ------ | ---- | ---------------- |
${charges_text_arr.join('\n')}
`

  // console.log(charges_text)
  case_markdown.push(charges_text)

  const future_proceedings = `
# Proceedings

## Future Proceedings

**NO FUTURE EVENTS** Future events are not being rendered ~ SW
`

  case_markdown.push(future_proceedings)

  const past_proceedings = `
## Past Proceedings

| Date | Time | Type | Result | Location | Department |
| ---- | ---- | ---- | ------ | -------- | ---------- |
${pastProceedings
  .map((proceeding) => {
    const {
      proceedingDate, // '2021-05-25T08:30:00',
      location, // 'West Covina',
      department, // 'Dept. - 5',
      proceedingType, // 'Judicial Action',
      proceedingTypeID, // '83038',
      proceedingResult, // 'Proceedings Heard',
      judicialOfficer, // 'Lewis, Jacqueline',
      hearingComment, // null,
      document, // null,
    } = proceeding

    const proceeding_date = new Date(proceedingDate)

    const local = { timeZone: 'America/Los Angeles' }

    return `| ${proceeding_date.toLocaleDateString(local)} | ${proceeding_date.toLocaleTimeString(
      local
    )} | ${proceedingType} | ${proceedingResult} | ${location} | ${department} |`
  })
  .join('\n')}
 `

  // console.log(past_proceedings)
  case_markdown.push(past_proceedings)

  let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const custody_status = `
# Bail

## Custody Status

| Date | Type | Group Type | Bail Amount | Warrant ID |
| ---- | ---- | ---------- | ----------- | ---------- |
${bondSettings
  .map((bond_setting) => {
    const {
      partyName, // 'DAVID JOHN HALL',
      settingGroupType, // 'By Case',
      settingDate, // '2019-04-25T00:00:00',
      settingDateDisplay, // '4/25/2019',
      settingType, // 'On Probation',
      description, // 'On Probation',
      bailAmount, // 0,
      warrantID, // '',
    } = bond_setting

    return `| ${settingDateDisplay} | ${settingType} | ${settingGroupType} | ${USDollar.format(
      bailAmount
    )} | ${warrantID} |`
  })
  .join('\n')}
`

  case_markdown.push(custody_status)

  function getBondsText(bonds) {
    return `
| Date | Name | Amount | Type | Bond Number | Bond ID | Surety ID |
| ---- | ---- | ------ | ---- | ---- ------ | ------- | ------ -- |
${bonds
  .map((bond) => {
    const {
      defendantID, // "26188889",
      suretyID, // "303517",
      propertyBondID, // "",
      bondID, // "502305",
      bondNumber, // "SV254959167",
      bondType, // "Surety Bond",
      bondAmount, // 20000,
      bondAmountDisplay, // "$20,000.00",
      courtDate, // "2019-02-11T00:00:00",
      courtDateDisplay, // "2/11/2019",
      bondCompanyName, // "Aladdin Bail Bonds",
      statuses, // [],
      statusDisplay, // ""
    } = bond

    return `| ${courtDateDisplay} | ${bondCompanyName} | ${bondAmountDisplay} | ${bondType} | ${bondNumber} | ${bondID} | ${suretyID} |`
  })
  .join('\n')}
`
  }

  const bonds_information = `
## Bonds Information 

${bonds.length == 0 ? '**No Bonds Information**' : getBondsText(bonds)}
`

  case_markdown.push(bonds_information)

  //   const warrants_text = `
  // ## Warrants

  // ${warrants
  //   .map((warrent) => {
  //     return ``
  //   })
  //   .join('\n')}

  // `

  const {
    probation,
    sentenceType,
    sentenceDate,
    sentenceDateDisplay,
    judicialOfficer,
    amendReason,
    chargeNumber,
    chargeDescription,
    driversLicenseConditions,
    programs,
    confinements,
    comments,
  } = sentencing[0]

  // sentenceType: 'Post Disposition Proceeding',
  // sentenceDate: '2021-05-25T00:00:00',
  // sentenceDateDisplay: '5/25/2021',
  // judicialOfficer: 'Lewis, Jacqueline',
  // amendReason: 'Amended',
  // chargeNumber: '001',
  // chargeDescription: 'VC23152(f)-M Driving Under Influence of Alcohol and Drug',
  // probation:

  // probationType: 'Summary Probation',
  // duration: '3 years',
  // conditions: [],
  // excludeTollingDays: true,
  // conditionsDisplay: '',
  // statuses: []
  // lastStatus: {
  //   probationStatusCollectionID: '13607745',
  //   probationStatusCode: 'REVK',
  //   status: 'REVOKED',
  //   statusDate: '2021-05-25',
  //   statusDateObject: '2021-05-25T00:00:00',
  //   statusDateDisplay: '5/25/2021',
  // },
  // probationDisplay: 'Summary Probation<ul><li><b>Term</b>: 3 years</li><li><b>Status</b>: REVOKED</li></ul>',

  function getProbationSummaryText(probation) {
    const { duration, lastStatus, conditions } = probation[0]

    return `
### Probation is granted.

**Term:** ${duration}

**Status:** ${lastStatus.status}

**Last Updated:** ${lastStatus.statusDateDisplay} 

**Conditions:** 
${conditions
  .map((condition) => {
    const {
      conditionID, // '16342833',
      conditionTypeCode, // '327TCIS',
      conditionType, // '327',
      effectiveDateStart, // '2019-04-25',
      effectiveDateStartObject, // '2019-04-25T00:00:00',
      effectiveDateStartDisplay, // '4/25/2019',
      status, // {}
      comment, // '327 ENROLL WITHIN  21 DAYS IN AN AB-541 PROGRAM.',
    } = condition

    const {
      statusCode, // 'ACT',
      statusType, // 'Active',
      statusDate, // '2019-04-25',
      statusDateObject, // '2019-04-25T00:00:00',
      statusDateDisplay, // '4/25/2019',
    } = status

    return `
- ${comment}
 - ${conditionType} effective ${effectiveDateStartDisplay}
 - Active on ${statusDateDisplay}
`
  })
  .join('\n')}

`
  }

  function getConfinementText(confinements) {
    return confinements
      .map((confinement) => {
        const {
          confinementType, // 'Los Angeles County Jail',
          description, // 'Jail at Los Angeles County Jail',
          durations, //
        } = confinement

        return `
- **${description}**
 - **Type:** ${confinementType}

${durations.map((pair) => `- ${pair.key}: ${pair.value}`).join('\n')}`
      })
      .join('\n')
  }

  function getProgramText(programs) {
    return programs
      .map((program) => {
        const {
          ordered, // true,
          recommended, // false,
          enrollByDate, // '1900-01-01T00:00:00',
          enrollByDateString, // '',
          description, // 'Licensed Driving Under the Influence Program',
          completeByDate, // '1900-01-01T00:00:00',
          completeByDateString, // '',
          datesDisplay, // '',
        } = program

        return `
- **Program Type:** ${description} 
 - **Ordered:** ${ordered}
 - **Recommended:** ${recommended}`
      })
      .join('\n')
  }

  function getDriversLicenseConditionsText(driversLicenseConditions) {
    return driversLicenseConditions
      .map((condition) => {
        const { conditions } = condition

        return conditions
          .map((pair) => {
            const {
              description, // 'DMV Reporting Conditions',
              duration, // '',
            } = pair

            return `- ${description} ${duration}`
          })
          .join('\n')
      })
      .join('\n')
  }

  const sentencing_text = `
# Sentencing

| Charge | Charge Description | Sentence Date | Judicial Officer |
| ------ | ------------------ | ------------- | ---------------- |
| ${chargeNumber} | ${chargeDescription} | ${sentenceDateDisplay} | ${judicialOfficer} |


## Probation
${probation.length == 0 ? '### No Probation Granted' : getProbationSummaryText(probation)}

## Confinements
${confinements.length == 0 ? '### No Confinements' : getConfinementText(confinements)}

## Programs
${programs.length == 0 ? '### No Programs' : getProgramText(programs)}

## Driver's Liscence Conditions
${
  driversLicenseConditions == 0
    ? `### No Driver's License Conditions`
    : getDriversLicenseConditionsText(driversLicenseConditions)
}

## Comments
${comments.map((c) => `- ${c.comment}`).join('\n')}
`

  // console.log(sentencing_text)

  case_markdown.push(sentencing_text)

  return case_markdown.join('\n <br>\n ')
}

/**
 *  This function uses an llm to transform unstructured text into
 *  a case_id which is a single single that represents a legal case
 *
 * @param {String} text
 *
 */
export async function generateCaseId(text) {
  const completion_json = {
    model: 'gpt-3.5-turbo-1106',
    messages: [
      {
        role: 'system',
        content:
          'Assume the role of a legal data analyst.  In your role you will extract structured data from unstructured documents.\n\nIn particular, you will extract:\n\ncase_id,\n\n\ngood examples:\n\n{\n"case_id": "GLN9GD00008-01"\n}\n\n{\n"case_id": "9PD00009"\n}\n\nIf there is no case id found in the document\n\n{\n"case_id": null\n}\n\nOnly produce valid JSON',
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 1,
    max_tokens: 25, // small token s
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(completion_json),
  })

  const res_json = await res.json()
  const ai_content = res_json.choices[0].message.content ?? null
  const ai_json = JSON.parse(ai_content) ?? { case_id: null }
  const { case_id } = ai_json
  return case_id
}

/**
 *
 * @param {*} pdf object from mozilla pdf.js
 */
export async function getPdfText(pdf) {
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
 * @param {*} state
 * @return {Uint8Array}
 */
export async function generateCr181(state, origin) {
  const pdf_res = await fetch(`${origin}/forms/cr181.pdf`)
  let pdf = await pdfjsLib.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

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

  for (const [key, value] of Object.entries(form_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

  let updated_pdf_bytes = await pdf.saveDocument()

  return updated_pdf_bytes
}

/**
 *
 * @param {*} state
 * @returns {Uint8Array}
 */
export async function generateCr180(state, origin) {
  const pdf_res = await fetch(`${origin}/forms/cr180.pdf`)
  let pdf = await pdfjsLib.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

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

  for (const [key, value] of Object.entries(caption_data)) {
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
    // info(`Case ${state.case_id} classifeid as => 1203.4 for CR-180 form`)
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
    // info(`Case ${state.case_id} classifeid as => 1203.4a for CR-180 form`)
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

  // return the update pdf bytes
  return updated_pdf_bytes
}

/**
 *
 * @param {*} state
 * @returns {Uint8Array}
 */
export async function generateCr106(state, origin) {
  const pdf_res = await fetch(`${origin}/forms/cr106.pdf`)
  let pdf = await pdfjsLib.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

  const form_data = {
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

  for (const [key, value] of Object.entries(form_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

  let updated_pdf_bytes = await pdf.saveDocument()

  return updated_pdf_bytes
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
  const completion_json = {
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
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(completion_json),
  })

  const res_json = await res.json()
  const generated_json_string = res_json.choices[0].message.content
  const court_json = JSON.parse(generated_json_string)
  return court_json
}

export function computeSummaryInfo(case_json) {}
