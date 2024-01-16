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
