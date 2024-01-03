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
  is_probation_granted: true,
  probation_status: 'Terminated',
  is_expungement_eligible: true,
  filenames: ['LA Court.pdf'],
  service_date: '1/3/2024',
}

async function analyzePDF() {
  const pdfjsLib = await import('pdfjs-dist')

  let pdf = await pdfjsLib.getDocument('./forms/cr106.pdf').promise

  let fields = await pdf.getFieldObjects()
}

async function generateCr106(state) {
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

  fs.writeFileSync('./cr106_ai_filled.pdf', updated_pdf_bytes)
}

generateCr106(state)
