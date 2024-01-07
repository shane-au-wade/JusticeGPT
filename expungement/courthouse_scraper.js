const ID_PREFIX = '9WC'

const START_ID = 1

const END_ID = 1000

let _ids = [...Array(END_ID).keys()]

const ids = _ids.map((_id) => `${ID_PREFIX}${_id.toString().padStart(5, 0)}`)

console.log(ids)

/** init_query_json schema
   * {
  isSuccess: true,
  errorMessage: '',
  errorCode: 0,
  resultList: [
    {
      litigationTypeCode: 'CR',
      caseNumber: 'CIT9WC00099-01',
      caseID: '14901330',
      caseTitle: 'The People of the State of California vs. CUEVAS, CHRISTIAN OMAR',
      caseTypeDescription: 'Misdemeanor',
      caseTypeID: '94884',
      locationName: 'West Covina Courthouse',
      lea: '',
      judicialOfficer: '(Department, WC5) ',
      litigationTypeDescription: 'Adult',
      dataSource: 'O',
      caseSecurityLevel: 0,
      filingDate: '2019-01-04T00:00:00',
      caseListDisplayText: 'CIT9WC00099-01'
    }
  ],
  mode: 'Odyssey=production,DataWarehouse=production'
}
 */

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

async function getRawCaseJson() {
  const init_query = await fetch(`https://media.lacourt.org/lascmediaproxy/api/AzureApi/GetCriminalCaseList/${ids[99]}`)

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

  console.log(second_query_json)
  const raw_case_json = second_query_json.resultList[0]
}

getRawCaseJson()
