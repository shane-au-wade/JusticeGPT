const fs = require('fs')
const path = require('path')

// utility to sleep for some amount of time
function randomSleep(min_ms, max_ms) {
  const ms = Math.floor(Math.random() * (max_ms - min_ms) + min_ms)
  console.log(`[INFO] sleeping for => ${ms}ms`)
  return new Promise((resolve) => setTimeout(resolve, ms))
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

async function getRawCaseJson(case_id) {
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

  raw_case_json.summary_info = {
    case_number: caseNumber,
    case_title: caseTitle,
    case_type: caseTypeDescription,
    courthouse_location: locationName,
    security_level: caseSecurityLevel,
    file_date: filingDate,
    litigation_type: litigationTypeDescription,
    litigation_code: litigationTypeCode,
  }

  return raw_case_json
}

const BASE_DIR = path.dirname(__filename)

const ID_PREFIX = '9PD'

const START_ID = 1

const END_ID = 200

let _ids = [...Array(END_ID).keys()]

// const ids = _ids.map((_id) => `${ID_PREFIX}${(_id + 1).toString().padStart(5, 0)}`)

const ids = ['2PD00059']

console.log(ids)

const OUTPUT_DIR = path.join(BASE_DIR, `${ids.at(0)}_${ids.at(-1)}`)

console.log(OUTPUT_DIR)

// ensure output dir
try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR)
  }
} catch (err) {
  console.error(err)
}

let case_map = {}

const CASE_MAP_CACHE = path.join(BASE_DIR, 'case_map_cache.json')

if (fs.existsSync(CASE_MAP_CACHE)) {
  const cached_case_map = JSON.parse(fs.readFileSync(CASE_MAP_CACHE))
  case_map = {
    ...cached_case_map,
  }
}

async function main() {
  for (const id of ids) {
    if (case_map[id]) {
      console.log('[INFO] cached => ', id)
      continue
    }

    await randomSleep(3000, 15000)

    console.log('[INFO] Searching => ', id)

    let case_json
    try {
      // search the id via the public courthouse api
      case_json = await getRawCaseJson(id)
    } catch (error) {
      console.log('[ERROR] Query failed => ', id)
      console.log('\n\n', error)
      // if the api call fails
      case_map[id] = {
        is_success: false,
        summary_info: null,
      }
      // write the case_map json to disc
      fs.writeFileSync(CASE_MAP_CACHE, JSON.stringify(case_map, null, 2))
      continue
    }

    if (!case_json) {
      console.log('[INFO] No data found => ', id)
      // if the api call fails
      case_map[id] = {
        is_success: false,
        summary_info: null,
      }
      // write the case_map json to disc
      fs.writeFileSync(CASE_MAP_CACHE, JSON.stringify(case_map, null, 2))
      continue
    }

    // api call succeeds, we have json for the case
    // filter based on basic criteria

    const { caseInfo, parties, otherCriminalInformation, summary_info } = case_json

    console.log('[INFO] Data found => ', id)
    console.log('[INFO] case_json =>\n\n', summary_info)

    // fs.writeFileSync('test.json', JSON.stringify(case_json))

    const _charges = otherCriminalInformation.charges.map((charge) => {
      const {
        locationID,
        caseNumber,
        defendantID,
        countNumber,
        chargeCode,
        statuteName,
        statuteURL,
        pleaHistory,
        dispositions,
        pleaHistoryDisplay,
        lastDispositionDisplay,
        chargeDispositionDate,
        chargeDispositionDateString,
        chargeDisposition,
        sentenceDispositionDate,
        sentenceDispositionDateString,
        sentenceDisposition,
        garbageFlag,
        dispositionCode,
        pendingHearing,
        warrantFlag,
        jurisdiction,
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

    console.log(`[INFO] convictions => `, convictions.length)

    // update case_map json
    case_map[id] = {
      is_success: true,
      summary_info: {
        ...summary_info,
        convictions: convictions,
      },
    }

    // dump the raw case_json to disc
    // only dump cases with convictions

    // if (convictions.length > 0) {
    if (true) {
      console.log(`[INFO] saving case json for possible expungement`)
      const case_json_path = path.join(OUTPUT_DIR, `${id}.json`)
      fs.writeFileSync(case_json_path, JSON.stringify(case_json, null, 2))
    }

    // write the case_map json to disc
    fs.writeFileSync(CASE_MAP_CACHE, JSON.stringify(case_map, null, 2))
  }
}

main()
