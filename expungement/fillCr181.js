const fs = require('fs')

const state = {
  case_id: '0EM00001',
  case_path: '/home/shane/repos/JusticeGPT/expungement/furnace/0EM00001',
  text: ['...'],
  attorney: {
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
    attorney_for: 'GARCIA, DAVID CASTILLO',
  },
  court: {
    county: 'Los Angeles',
    street: '11234 East Valley Blvd.',
    city: 'El Monte',
    state: 'CA',
    zip: '91731',
  },
  defendant_name: 'GARCIA, DAVID CASTILLO',
  date_of_conviction: '1/10/2020',
  court_house_location: 'El Monte Courthouse',
  charges: [
    {
      count: '001',
      charge_statute: 'PC243(e)(1)-M',
      plea: 'Pleads Nolo Contendere',
      last_disposition: 'Conviction After Plea',
      is_conviction: true,
    },
  ],
  is_misdemeanor: true,
  is_felony: false,
  is_on_probation: true,
  probation_status: 'Terminated',
  is_expungement_eligible: true,
  filenames: ['LA Court.pdf'],
}

const pdf_caption_fields = {
  '350R': {
    field_name: 'CR-181.Page1.Caption.HeaderSub.CaseNumber.CaseNumber2',
    id: '350R',
    multiline: false,
    type: 'text',
  },
  '338R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.AttorneyBarNo',
    id: '338R',
    multiline: false,
    type: 'text',
  },
  '339R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Name',
    id: '339R',
    multiline: false,
    type: 'text',
  },
  '340R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.AttorneyFirm',
    id: '340R',
    multiline: false,
    type: 'text',
  },
  '341R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Street',
    id: '341R',
    multiline: false,
    type: 'text',
  },
  '342R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.City',
    id: '342R',
    multiline: false,
    type: 'text',
  },
  '343R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.State',
    id: '343R',
    multiline: false,
    type: 'text',
  },
  '344R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Zip',
    id: '344R',
    multiline: false,
    type: 'text',
  },
  '345R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Phone',
    id: '345R',
    multiline: false,
    type: 'text',
  },
  '346R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Fax',
    id: '346R',
    multiline: false,
    type: 'text',
  },
  '347R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.Email',
    id: '347R',
    multiline: false,
    type: 'text',
  },
  '348R': {
    field_name: 'CR-181.Page1.Caption.AttorneyPartyInfo.AttorneyFor',
    id: '348R',
    multiline: false,
    type: 'text',
  },
  '334R': {
    field_name: 'CR-181.Page1.Caption.CourtInfo.CourtCounty',
    id: '334R',
    multiline: false,
    type: 'text',
  },
  '335R': {
    field_name: 'CR-181.Page1.Caption.CourtInfo.CourtStreet',
    id: '335R',
    multiline: false,
    type: 'text',
  },
  '336R': {
    field_name: 'CR-181.Page1.Caption.CourtInfo.CourtMailingAdd',
    id: '336R',
    multiline: false,
    type: 'text',
  },
  '337R': {
    field_name: 'CR-181.Page1.Caption.CourtInfo.CourtCityZip',
    id: '337R',
    multiline: false,
    type: 'text',
  },
  '333R': {
    field_name: 'CR-181.Page1.Caption.TitlePartyName.Party1',
    id: '333R',
    multiline: false,
    type: 'text',
  },
}

async function generateCr181(state) {
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
    // console.log(key, value)
    pdf.annotationStorage.setValue(key, { value: value })
  }

  let updated_pdf_bytes = await pdf.saveDocument()

  fs.writeFileSync('./cr181_ai_filled.pdf', updated_pdf_bytes)
}

generateCr181(state)

async function analyzePDF() {
  let fields = await pdf.getFieldObjects()

  let caption_fields_arr = Object.entries(fields).filter(([key, value]) => {
    const isEditable = value[0].editable
    const isHidden = value[0].hidden
    if (!isEditable || isHidden) return false
    if (key.includes('Caption')) return true
  })

  const simple_caption_fields = caption_fields_arr.map(([key, value]) => {
    const { id, multiline, type } = value[0]

    const cleaned_key = key.replaceAll('[0]', '').replaceAll('Atty', 'Attorney').replaceAll('Crt', 'Court')

    return [id, { field_name: cleaned_key, id: id, multiline: multiline, type, type }]
  })

  let caption_fields = Object.fromEntries(caption_fields_arr)

  let s_caption_fields = Object.fromEntries(simple_caption_fields)

  fs.writeFileSync('./caption_fields.json', JSON.stringify(s_caption_fields, null, 2))

  //   console.log(JSON.stringify(s_caption_fields, null, 2))
}
