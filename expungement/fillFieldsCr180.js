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

async function analyzePDF() {
  const pdfjsLib = await import('pdfjs-dist')

  let pdf = await pdfjsLib.getDocument('./forms/cr180.pdf').promise

  let fields = await pdf.getFieldObjects()

  let caption_fields_arr = Object.entries(fields).filter(([key, value]) => {
    const isEditable = value[0].editable
    const isHidden = value[0].hidden
    if (!isEditable || isHidden) return false

    if (key.includes('CourtUse')) return false
    if (key.includes('CrtUse')) return false
    if (key.includes('Caption')) return true
  })

  let editable_fields_arr = Object.entries(fields).filter(([key, value]) => {
    const isEditable = value[0].editable
    const isHidden = value[0].hidden
    if (!isEditable || isHidden) return false

    return true
    // if (key.includes('CourtUse')) return false
    // if (key.includes('CrtUse')) return false
    // if (key.includes('Caption')) return true
  })

  let s = editable_fields_arr.map((arr) => arr[0])

  const simple_caption_fields = caption_fields_arr.map(([key, value]) => {
    const { id, multiline, type } = value[0]

    const cleaned_key = key.replaceAll('[0]', '').replaceAll('Atty', 'Attorney').replaceAll('Crt', 'Court')

    return [id, { field_name: cleaned_key, id: id, multiline: multiline, type, type }]
  })

  let caption_fields = Object.fromEntries(caption_fields_arr)

  let s_caption_fields = Object.fromEntries(simple_caption_fields)

  let conviction_table_fields = Object.entries(fields).filter(([key, value]) => {
    const isEditable = value[0].editable
    const isHidden = value[0].hidden
    if (!isEditable || isHidden) return false
    if (key.includes('ConvTable')) return true
  })

  let simple_conv_table = conviction_table_fields.map(([key, value]) => {
    const { id, multiline, type } = value[0]
    const cleaned_key = key.replaceAll('[0]', '').replaceAll('Atty', 'Attorney').replaceAll('Crt', 'Court')
    return [id, { field_name: cleaned_key, id: id, multiline: multiline, type, type }]
  })

  let sct = Object.fromEntries(simple_conv_table)

  fs.writeFileSync('./cr180_conviction_table_fields.json', JSON.stringify(sct, null, 2))

  // [code, section, type_of_offense, reduce_to_misdeamor, reduce_to_infraction ]
  const conviction_table = [
    ['294R', '295R', '296R', '297R', '298R'],
    ['289R', '290R', '291R', '292R', '293R'],
    ['284R', '285R', '286R', '287R', '288R'],
    ['279R', '280R', '281R', '282R', '283R'],
    ['274R', '275R', '276R', '277R', '278R'],
  ]

  fs.writeFileSync('./cr180_caption_fields.json', JSON.stringify(s_caption_fields, null, 2))

  //   console.log(JSON.stringify(s_caption_fields, null, 2))
}

// analyzePDF()

async function generateCr180(state) {
  const pdfjsLib = await import('pdfjs-dist')

  let pdf = await pdfjsLib.getDocument('./forms/cr180.pdf').promise

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
  }

  for ([key, value] of Object.entries(caption_data)) {
    if (!value) continue
    pdf.annotationStorage.setValue(key, { value: value })
  }

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

  let updated_pdf_bytes = await pdf.saveDocument()

  fs.writeFileSync('./cr180_ai_filled.pdf', updated_pdf_bytes)
}

generateCr180(state)

const caption_fields = {
  '325R': {
    field_name: 'CR-180.Page1.P1Caption.HeaderSub.Stmp.CaseNumber.CaseNumber1',
    id: '325R',
    multiline: false,
    type: 'text',
  },
  '308R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.AttorneyBarNo',
    id: '308R',
    multiline: false,
    type: 'text',
  },
  '309R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Name',
    id: '309R',
    multiline: false,
    type: 'text',
  },
  '310R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.AttorneyFirm',
    id: '310R',
    multiline: false,
    type: 'text',
  },
  '311R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Street',
    id: '311R',
    multiline: false,
    type: 'text',
  },
  '312R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.City',
    id: '312R',
    multiline: false,
    type: 'text',
  },
  '313R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.State',
    id: '313R',
    multiline: false,
    type: 'text',
  },
  '314R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Zip',
    id: '314R',
    multiline: false,
    type: 'text',
  },
  '315R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Phone',
    id: '315R',
    multiline: false,
    type: 'text',
  },
  '316R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Fax',
    id: '316R',
    multiline: false,
    type: 'text',
  },
  '317R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.Email',
    id: '317R',
    multiline: false,
    type: 'text',
  },
  '318R': {
    field_name: 'CR-180.Page1.P1Caption.AttorneyPartyInfo.AttorneyFor',
    id: '318R',
    multiline: false,
    type: 'text',
  },
  '304R': {
    field_name: 'CR-180.Page1.P1Caption.CourtInfo.CourtCounty',
    id: '304R',
    multiline: false,
    type: 'text',
  },
  '305R': {
    field_name: 'CR-180.Page1.P1Caption.CourtInfo.CourtStreet',
    id: '305R',
    multiline: false,
    type: 'text',
  },
  '306R': {
    field_name: 'CR-180.Page1.P1Caption.CourtInfo.CourtMailingAdd',
    id: '306R',
    multiline: false,
    type: 'text',
  },
  '307R': {
    field_name: 'CR-180.Page1.P1Caption.CourtInfo.CourtCityZip',
    id: '307R',
    multiline: false,
    type: 'text',
  },
  '303R': {
    field_name: 'CR-180.Page1.P1Caption.TitlePartyName.Defendant',
    id: '303R',
    multiline: false,
    type: 'text',
  },
}

const conviction_table_ids = {
  '294R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row1.Code1',
    id: '294R',
    multiline: false,
    type: 'text',
  },
  '295R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row1.Section1',
    id: '295R',
    multiline: false,
    type: 'text',
  },
  '296R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row1.TypeOff1',
    id: '296R',
    multiline: false,
    type: 'text',
  },
  '297R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row1.Reduce1',
    id: '297R',
    multiline: false,
    type: 'text',
  },
  '298R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row1.Offense1',
    id: '298R',
    multiline: false,
    type: 'text',
  },
  '289R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row2.Code2',
    id: '289R',
    multiline: false,
    type: 'text',
  },
  '290R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row2.Section2',
    id: '290R',
    multiline: false,
    type: 'text',
  },
  '291R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row2.TypeOff2',
    id: '291R',
    multiline: false,
    type: 'text',
  },
  '292R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row2.Reduce2',
    id: '292R',
    multiline: false,
    type: 'text',
  },
  '293R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row2.Offense2',
    id: '293R',
    multiline: false,
    type: 'text',
  },
  '284R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row3.Code3',
    id: '284R',
    multiline: false,
    type: 'text',
  },
  '285R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row3.Section3',
    id: '285R',
    multiline: false,
    type: 'text',
  },
  '286R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row3.TypeOff3',
    id: '286R',
    multiline: false,
    type: 'text',
  },
  '287R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row3.Reduce3',
    id: '287R',
    multiline: false,
    type: 'text',
  },
  '288R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row3.Offense3',
    id: '288R',
    multiline: false,
    type: 'text',
  },
  '279R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row4.Code4',
    id: '279R',
    multiline: false,
    type: 'text',
  },
  '280R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row4.Section4',
    id: '280R',
    multiline: false,
    type: 'text',
  },
  '281R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row4.TypeOff4',
    id: '281R',
    multiline: false,
    type: 'text',
  },
  '282R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row4.Reduce4',
    id: '282R',
    multiline: false,
    type: 'text',
  },
  '283R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row4.Offense4',
    id: '283R',
    multiline: false,
    type: 'text',
  },
  '274R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row5.Code5',
    id: '274R',
    multiline: false,
    type: 'text',
  },
  '275R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row5.Section5',
    id: '275R',
    multiline: false,
    type: 'text',
  },
  '276R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row5.TypeOff5',
    id: '276R',
    multiline: false,
    type: 'text',
  },
  '277R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row5.Reduce5',
    id: '277R',
    multiline: false,
    type: 'text',
  },
  '278R': {
    field_name: 'CR-180.Page1.LI1.li1.ConvTable.Row5.Offense5',
    id: '278R',
    multiline: false,
    type: 'text',
  },
}
