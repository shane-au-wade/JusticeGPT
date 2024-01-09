const fs = require('fs')

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

const RAW_CASE_JSON = {
  caseType: 'Criminal',
  securityLevel: 0,
  caseInfo: [
    { key: 'Case Number', value: 'CIT9WC00099-01', toShow: true },
    { key: 'Case Type Code', value: 'CR', toShow: false },
    { key: 'Case ID', value: '14901330', toShow: false },
    { key: 'Defendant ID', value: '01', toShow: true },
    { key: 'Filing Date', value: '1/4/2019', toShow: true },
    { key: 'Arrest Date', value: '9/6/2018', toShow: true },
    { key: 'Filing Courthouse', value: 'West Covina Courthouse', toShow: true },
    { key: 'Case Type', value: 'Criminal', toShow: false },
    { key: 'Case UType ID', value: 'CR', toShow: false },
    { key: 'Criminal Location ID', value: '151300', toShow: false },
    { key: 'Court Location ID', value: '151300', toShow: false },
    { key: 'Case Title', value: 'The People of the State of California vs. CUEVAS, CHRISTIAN OMAR', toShow: true },
  ],
  events: [
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2021-05-25T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Bench Warrant Issued',
      eventTypeID: '103951',
      eventTypeDescription: 'Bench Warrant Issued',
      eventDate: '2021-05-25T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Docket Line Entry',
      eventTypeID: '82992',
      eventTypeDescription: 'Docket Line Entry',
      eventDate: '2021-05-18T00:00:00',
      filedBy: '',
      document: null,
      comment:
        'NOTICE OF NON-COMPLIANCE OF AB541 PROGRAM FROM COURT COMPLIANCE AND SERVICES PROGRAM FILED. CASE FILE FORWARDED TO DEPARTMENT 005 FOR JUDICIAL REVIEW. ES',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2020-08-13T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2020-07-27T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2019-09-30T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2019-08-23T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2019-07-03T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'ADR Transmission',
      eventTypeID: '83477',
      eventTypeDescription: 'ADR Transmission',
      eventDate: '2019-05-03T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Waived Right to Counsel',
      eventTypeID: '81368',
      eventTypeDescription: 'Waived Right to Counsel',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'DMV Abstract Issued',
      eventTypeID: '107837',
      eventTypeDescription: 'DMV Abstract Issued',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Advised of Charges and Direct Consequences of Plea',
      eventTypeID: '81375',
      eventTypeDescription: 'Advised of Charges and Direct Consequences of Plea',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Advised of Charges and Direct Consequences of Plea',
      eventTypeID: '81375',
      eventTypeDescription: 'Advised of Charges and Direct Consequences of Plea',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Court Found Plea Knowledgeable/Intelligently Made/Voluntary',
      eventTypeID: '88087',
      eventTypeDescription: 'Court Found Plea Knowledgeable/Intelligently Made/Voluntary',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Waived Privilege Against Self-Incrimination',
      eventTypeID: '81369',
      eventTypeDescription: 'Waived Privilege Against Self-Incrimination',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Waived Right to Confront and Cross Examine Witnesses',
      eventTypeID: '81370',
      eventTypeDescription: 'Waived Right to Confront and Cross Examine Witnesses',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Waived Right to Trial by Court or Jury',
      eventTypeID: '81372',
      eventTypeDescription: 'Waived Right to Trial by Court or Jury',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Arraignment Held',
      eventTypeID: '81316',
      eventTypeDescription: 'Arraignment Held',
      eventDate: '2019-04-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Minute Order',
      eventTypeID: '4215',
      eventTypeDescription: 'Minute Order',
      eventDate: '2019-01-10T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Complaint Filed',
      eventTypeID: '81291',
      eventTypeDescription: 'Complaint Filed',
      eventDate: '2019-01-04T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
    {
      eventType: 'Defendant Arrested and Booked',
      eventTypeID: '95659',
      eventTypeDescription: 'Defendant Arrested and Booked',
      eventDate: '2018-09-06T00:00:00',
      filedBy: '',
      document: null,
      comment: '',
      isDocketable: true,
      hiddenFromPublic: false,
      dataSource: null,
    },
  ],
  tabs: [
    { key: 'CASE_INFORMATION', value: 'Case Information', toShow: true },
    { key: 'PARTIES', value: 'Parties', toShow: true },
    { key: 'HEARINGS', value: 'Proceedings', toShow: true },
    { key: 'ROA', value: 'Register of Actions', toShow: true },
    { key: 'BONDS', value: 'Bonds', toShow: true },
    { key: 'CR_CHARGES', value: 'Charges', toShow: true },
    { key: 'CR_SENTENCING', value: 'Sentencing', toShow: true },
  ],
  parties: [
    {
      partyName: 'The People of the State of California',
      partyTypeDescription: 'Plaintiff',
      remarks: '',
      partyID: '1',
      barNumber: '',
      partyTypes: [
        {
          displayText: 'Plaintiff',
          partyType: 'Plaintiff',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Michael J. Yun',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for The People of the State of California</li>\r\n<li>Deputy District Attorney</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '155530',
      barNumber: '292587',
      partyTypes: [
        {
          displayText: 'Attorney for The People of the State of California',
          partyType: 'Attorney',
          associatedPerson: 'The People of the State of California',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy District Attorney',
          partyType: 'Deputy District Attorney',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Brian David Soash',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for The People of the State of California</li>\r\n<li>Deputy District Attorney</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '167021',
      barNumber: '304235',
      partyTypes: [
        {
          displayText: 'Attorney for The People of the State of California',
          partyType: 'Attorney',
          associatedPerson: 'The People of the State of California',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy District Attorney',
          partyType: 'Deputy District Attorney',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Matthew Thomas Bunnett',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for The People of the State of California</li>\r\n<li>Deputy District Attorney</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '18863011',
      barNumber: '311056',
      partyTypes: [
        {
          displayText: 'Attorney for The People of the State of California',
          partyType: 'Attorney',
          associatedPerson: 'The People of the State of California',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy District Attorney',
          partyType: 'Deputy District Attorney',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Shane Cameron Morrison',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for The People of the State of California</li>\r\n<li>Deputy District Attorney</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '147435',
      barNumber: '284115',
      partyTypes: [
        {
          displayText: 'Attorney for The People of the State of California',
          partyType: 'Attorney',
          associatedPerson: 'The People of the State of California',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy District Attorney',
          partyType: 'Deputy District Attorney',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'CHRISTIAN OMAR CUEVAS',
      partyTypeDescription: 'Defendant',
      remarks: '',
      partyID: '24015268',
      barNumber: '',
      partyTypes: [
        {
          displayText: 'Defendant',
          partyType: 'Defendant',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Kyle Andrew Hofmeister',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for CHRISTIAN OMAR CUEVAS</li>\r\n<li>Deputy Public Defender</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '20783178',
      barNumber: '323186',
      partyTypes: [
        {
          displayText: 'Attorney for CHRISTIAN OMAR CUEVAS',
          partyType: 'Attorney',
          associatedPerson: 'CHRISTIAN OMAR CUEVAS',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy Public Defender',
          partyType: 'Deputy Public Defender',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
    {
      partyName: 'Daniel A. Covarrubias-Klein',
      partyTypeDescription:
        '<ul style="position: relative; left: -27px;">\r\n<li>Attorney for CHRISTIAN OMAR CUEVAS</li>\r\n<li>Deputy Public Defender</li>\r\n</ul>\r\n',
      remarks: '',
      partyID: '170455',
      barNumber: '307645',
      partyTypes: [
        {
          displayText: 'Attorney for CHRISTIAN OMAR CUEVAS',
          partyType: 'Attorney',
          associatedPerson: 'CHRISTIAN OMAR CUEVAS',
          assignType: null,
          connection: null,
        },
        {
          displayText: 'Deputy Public Defender',
          partyType: 'Deputy Public Defender',
          associatedPerson: null,
          assignType: null,
          connection: null,
        },
      ],
      phoneNumbers: [],
    },
  ],
  relatedCases: [],
  historicalDocuments: [],
  pastProceedings: [
    {
      proceedingDate: '2021-05-25T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 5',
      proceedingType: 'Judicial Action',
      proceedingTypeID: '83038',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Lewis, Jacqueline',
      hearingComment: null,
      document: null,
    },
    {
      proceedingDate: '2021-05-18T08:30:00',
      location: 'West Covina',
      department: "Clerk's Office",
      proceedingType: 'Docket Line Entry',
      proceedingTypeID: '105905',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: null,
      hearingComment: null,
      document: null,
    },
    {
      proceedingDate: '2020-08-13T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 6',
      proceedingType: 'Setting of Violation Hearing',
      proceedingTypeID: '108016',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Martinez, Victor',
      hearingComment: '',
      document: null,
    },
    {
      proceedingDate: '2020-07-27T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 11',
      proceedingType: 'Bench Warrant Hearing',
      proceedingTypeID: '92963',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Chrostek, Joan M.',
      hearingComment: '',
      document: null,
    },
    {
      proceedingDate: '2019-09-30T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 10',
      proceedingType: 'Possible Violation of Probation',
      proceedingTypeID: '83002',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Coen, Lisa S.',
      hearingComment: null,
      document: null,
    },
    {
      proceedingDate: '2019-08-23T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 10',
      proceedingType: 'Possible Violation of Probation',
      proceedingTypeID: '83002',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Serna, Robert',
      hearingComment: null,
      document: null,
    },
    {
      proceedingDate: '2019-07-03T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 10',
      proceedingType: 'Possible Violation of Probation',
      proceedingTypeID: '83002',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Serna, Robert',
      hearingComment: null,
      document: null,
    },
    {
      proceedingDate: '2019-04-10T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 9',
      proceedingType: 'Bench Warrant Hearing',
      proceedingTypeID: '92963',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Townsend, Susan J',
      hearingComment: '',
      document: null,
    },
    {
      proceedingDate: '2019-01-10T08:30:00',
      location: 'West Covina',
      department: 'Dept. - 9',
      proceedingType: 'Arraignment',
      proceedingTypeID: '3310',
      proceedingResult: 'Proceedings Heard',
      judicialOfficer: 'Lewis, Jacqueline',
      hearingComment: null,
      document: null,
    },
  ],
  futureProceedings: [],
  registerOfActions: [
    {
      actionDate: '2021-05-25T08:30:00',
      actionDescription: 'Judicial Action - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 5)',
      document: null,
    },
    {
      actionDate: '2021-05-25T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2021-05-25T00:00:00',
      actionDescription: 'Bench Warrant Issued',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2021-05-18T08:30:00',
      actionDescription: 'Docket Line Entry - Proceedings Heard',
      additionalInformation: "(West Covina Clerk's Office)",
      document: null,
    },
    {
      actionDate: '2021-05-18T00:00:00',
      actionDescription: 'Docket Line Entry',
      additionalInformation:
        'NOTICE OF NON-COMPLIANCE OF AB541 PROGRAM FROM COURT COMPLIANCE AND SERVICES PROGRAM FILED. CASE FILE FORWARDED TO DEPARTMENT 005 FOR JUDICIAL REVIEW. ES',
      document: null,
    },
    {
      actionDate: '2020-08-13T08:30:00',
      actionDescription: 'Setting of Violation Hearing - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 6)',
      document: null,
    },
    {
      actionDate: '2020-08-13T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2020-07-27T08:30:00',
      actionDescription: 'Bench Warrant Hearing - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 11)',
      document: null,
    },
    {
      actionDate: '2020-07-27T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-09-30T08:30:00',
      actionDescription: 'Possible Violation of Probation - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 10)',
      document: null,
    },
    {
      actionDate: '2019-09-30T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-08-23T08:30:00',
      actionDescription: 'Possible Violation of Probation - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 10)',
      document: null,
    },
    {
      actionDate: '2019-08-23T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-07-03T08:30:00',
      actionDescription: 'Possible Violation of Probation - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 10)',
      document: null,
    },
    {
      actionDate: '2019-07-03T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-05-03T00:00:00',
      actionDescription: 'ADR Transmission',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T08:30:00',
      actionDescription: 'Bench Warrant Hearing - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 9)',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Waived Right to Counsel',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'DMV Abstract Issued',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Advised of Charges and Direct Consequences of Plea',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Advised of Charges and Direct Consequences of Plea',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Court Found Plea Knowledgeable/Intelligently Made/Voluntary',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Waived Privilege Against Self-Incrimination',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Waived Right to Confront and Cross Examine Witnesses',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Waived Right to Trial by Court or Jury',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-04-10T00:00:00',
      actionDescription: 'Arraignment Held',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-01-10T08:30:00',
      actionDescription: 'Arraignment - Proceedings Heard',
      additionalInformation: '(West Covina Dept. - 9)',
      document: null,
    },
    {
      actionDate: '2019-01-10T00:00:00',
      actionDescription: 'Minute Order',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2019-01-04T00:00:00',
      actionDescription: 'Complaint Filed',
      additionalInformation: '',
      document: null,
    },
    {
      actionDate: '2018-09-06T00:00:00',
      actionDescription: 'Defendant Arrested and Booked',
      additionalInformation: '',
      document: null,
    },
  ],
  otherCriminalInformation: {
    defendant: null,
    financialBalance: null,
    financialCollectionStatuses: null,
    warrants: null,
    interimConditions: [
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        orderDate: '2020-07-27T00:00:00',
        toDisplayString: '(707TCIS) 707  - TAHL WAIVER IS ORDERED FILED.',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        orderDate: '2019-08-23T00:00:00',
        toDisplayString: '(707TCIS) 707  - TAHL WAIVER IS ORDERED FILED.',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        orderDate: '2019-07-03T00:00:00',
        toDisplayString: '(707TCIS) 707  - TAHL WAIVER IS ORDERED FILED.',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        orderDate: '2019-04-10T00:00:00',
        toDisplayString: '(707TCIS) 707  - TAHL WAIVER IS ORDERED FILED.',
      },
    ],
    charges: [
      {
        locationID: '',
        caseNumber: 'CIT9WC00099-01',
        defendantID: '',
        countNumber: '001',
        chargeCode: 'VC23152(f)',
        statuteName: 'VC23152(f)-M Driving Under Influence of Alcohol and Drug',
        statuteURL: '',
        pleaHistory: ['4/10/2019: Pleads Guilty'],
        dispositions: ['4/10/2019 - Conviction After Plea'],
        pleaHistoryDisplay: '4/10/2019: Pleads Guilty',
        lastDispositionDisplay: '4/10/2019 - Conviction After Plea',
        chargeDispositionDate: '2019-04-10T00:00:00',
        chargeDispositionDateString: '4/10/2019',
        chargeDisposition: 'Conviction After Plea',
        sentenceDispositionDate: '1900-01-01T00:00:00',
        sentenceDispositionDateString: '',
        sentenceDisposition: '',
        garbageFlag: '',
        dispositionCode: 'CON',
        pendingHearing: '',
        warrantFlag: '',
        jurisdiction: '',
      },
      {
        locationID: '',
        caseNumber: 'CIT9WC00099-01',
        defendantID: '',
        countNumber: '002',
        chargeCode: 'HS11377',
        statuteName: 'HS11377-M Possessing a Controlled Substance',
        statuteURL: '',
        pleaHistory: [],
        dispositions: ['4/10/2019 - Dismissed Due to Plea Negotiation'],
        pleaHistoryDisplay: '',
        lastDispositionDisplay: '4/10/2019 - Dismissed Due to Plea Negotiation',
        chargeDispositionDate: '2019-04-10T00:00:00',
        chargeDispositionDateString: '4/10/2019',
        chargeDisposition: 'Dismissed Due to Plea Negotiation',
        sentenceDispositionDate: '1900-01-01T00:00:00',
        sentenceDispositionDateString: '',
        sentenceDisposition: '',
        garbageFlag: '',
        dispositionCode: 'DIN',
        pendingHearing: '',
        warrantFlag: '',
        jurisdiction: '',
      },
      {
        locationID: '',
        caseNumber: 'CIT9WC00099-01',
        defendantID: '',
        countNumber: '003',
        chargeCode: 'HS11364',
        statuteName: 'HS11364-M Possession Controlled Substance Paraphernalia',
        statuteURL: '',
        pleaHistory: [],
        dispositions: ['4/10/2019 - Dismissed Due to Plea Negotiation'],
        pleaHistoryDisplay: '',
        lastDispositionDisplay: '4/10/2019 - Dismissed Due to Plea Negotiation',
        chargeDispositionDate: '2019-04-10T00:00:00',
        chargeDispositionDateString: '4/10/2019',
        chargeDisposition: 'Dismissed Due to Plea Negotiation',
        sentenceDispositionDate: '1900-01-01T00:00:00',
        sentenceDispositionDateString: '',
        sentenceDisposition: '',
        garbageFlag: '',
        dispositionCode: 'DIN',
        pendingHearing: '',
        warrantFlag: '',
        jurisdiction: '',
      },
    ],
    bondSettings: [
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Warrant',
        settingDate: '2021-05-25T00:00:00',
        settingDateDisplay: '5/25/2021',
        settingType: 'Warrant Bail Set',
        description: 'Warrant Bail Set - $30,000.00',
        bailAmount: 30000,
        warrantID: '1622617',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Case',
        settingDate: '2020-08-13T00:00:00',
        settingDateDisplay: '8/13/2020',
        settingType: 'On Probation',
        description: 'On Probation',
        bailAmount: 0,
        warrantID: '',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Case',
        settingDate: '2020-07-27T00:00:00',
        settingDateDisplay: '7/27/2020',
        settingType: 'Released on Own Recognizance',
        description: 'Released on Own Recognizance',
        bailAmount: 0,
        warrantID: '',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Warrant',
        settingDate: '2019-09-30T00:00:00',
        settingDateDisplay: '9/30/2019',
        settingType: 'Warrant Bail Set',
        description: 'Warrant Bail Set - $50,000.00',
        bailAmount: 50000,
        warrantID: '1622618',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Case',
        settingDate: '2019-08-23T00:00:00',
        settingDateDisplay: '8/23/2019',
        settingType: 'On Probation',
        description: 'On Probation',
        bailAmount: 0,
        warrantID: '',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Case',
        settingDate: '2019-07-03T00:00:00',
        settingDateDisplay: '7/3/2019',
        settingType: 'On Probation',
        description: 'On Probation',
        bailAmount: 0,
        warrantID: '',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Case',
        settingDate: '2019-04-10T00:00:00',
        settingDateDisplay: '4/10/2019',
        settingType: 'On Probation',
        description: 'On Probation',
        bailAmount: 0,
        warrantID: '',
      },
      {
        partyName: 'CHRISTIAN OMAR CUEVAS',
        settingGroupType: 'By Warrant',
        settingDate: '2019-01-10T00:00:00',
        settingDateDisplay: '1/10/2019',
        settingType: 'Warrant Bail Set',
        description: 'Warrant Bail Set - $30,000.00',
        bailAmount: 30000,
        warrantID: '1622616',
      },
    ],
    bonds: [],
    sentencing: [
      {
        sentenceType: 'Post Disposition Proceeding',
        sentenceDate: '2021-05-25T00:00:00',
        sentenceDateDisplay: '5/25/2021',
        judicialOfficer: 'Lewis, Jacqueline',
        amendReason: 'Amended',
        chargeNumber: '001',
        chargeDescription: 'VC23152(f)-M Driving Under Influence of Alcohol and Drug',
        probation: [
          {
            probationType: 'Summary Probation',
            duration: '3 years',
            conditions: [],
            excludeTollingDays: true,
            conditionsDisplay: '',
            statuses: [
              {
                probationStatusCollectionID: '5038999',
                probationStatusCode: 'PREF',
                status: 'In Effect',
                statusDate: '2019-04-10',
                statusDateObject: '2019-04-10T00:00:00',
                statusDateDisplay: '4/10/2019',
              },
              {
                probationStatusCollectionID: '6598872',
                probationStatusCode: 'REVK',
                status: 'REVOKED',
                statusDate: '2019-09-30',
                statusDateObject: '2019-09-30T00:00:00',
                statusDateDisplay: '9/30/2019',
              },
              {
                probationStatusCollectionID: '9828041',
                probationStatusCode: 'REVREINSTC',
                status: 'Rev, Rein on Same Terms & Cond with following modifications',
                statusDate: '2020-08-13',
                statusDateObject: '2020-08-13T00:00:00',
                statusDateDisplay: '8/13/2020',
              },
              {
                probationStatusCollectionID: '13607745',
                probationStatusCode: 'REVK',
                status: 'REVOKED',
                statusDate: '2021-05-25',
                statusDateObject: '2021-05-25T00:00:00',
                statusDateDisplay: '5/25/2021',
              },
            ],
            statusesDisplay:
              '<ul><li>5/25/2021: REVOKED</li><li>8/13/2020: Rev, Rein on Same Terms & Cond with following modifications</li><li>9/30/2019: REVOKED</li><li>4/10/2019: In Effect</li></ul>5/25/2021: REVOKED',
            lastStatus: {
              probationStatusCollectionID: '13607745',
              probationStatusCode: 'REVK',
              status: 'REVOKED',
              statusDate: '2021-05-25',
              statusDateObject: '2021-05-25T00:00:00',
              statusDateDisplay: '5/25/2021',
            },
            probationDisplay: 'Summary Probation<ul><li><b>Term</b>: 3 years</li><li><b>Status</b>: REVOKED</li></ul>',
          },
        ],
        driversLicenseConditions: [],
        programs: [],
        confinements: [],
        comments: [
          {
            dispositionComponentInstanceID: '14114989',
            comment:
              "THE COURT HAS READ AND CONSIDERED THE CLERK'S NOTICE OF NON-COMPLIANCE FORM AND SUPPORTING DOCUMENTATION. . THE COURT FINDS THAT THE DEFENDANT HAS NOT ENROLLED IN THE REQUIRED AB541 PROGRAM. . PROBATION IS REVOKED. . BENCH WARRANT IN THE BAIL AMOUNT OF THIRTY THOUSAND DOLLARS IS ORDERED ISSUED. . PREVIOUSLY SET TO BE DUE 08/13/21: 19 DAYS OF COMMUNITY LABOR; FINE OR ADDITIONAL ONE DAY OF COMMUNITY LABOR; M.A.D.D. PROGRAM. .",
          },
        ],
        commentsDisplay:
          '<div style="padding-bottom: 10px;"><div style="font-weight: bold;">Comments</div><ul><li>THE COURT HAS READ AND CONSIDERED THE CLERK\'S NOTICE OF NON-COMPLIANCE FORM AND SUPPORTING DOCUMENTATION. . THE COURT FINDS THAT THE DEFENDANT HAS NOT ENROLLED IN THE REQUIRED AB541 PROGRAM. . PROBATION IS REVOKED. . BENCH WARRANT IN THE BAIL AMOUNT OF THIRTY THOUSAND DOLLARS IS ORDERED ISSUED. . PREVIOUSLY SET TO BE DUE 08/13/21: 19 DAYS OF COMMUNITY LABOR; FINE OR ADDITIONAL ONE DAY OF COMMUNITY LABOR; M.A.D.D. PROGRAM. .</li></ul></div>',
        probationDisplay:
          '<div style="padding-bottom: 10px;"><div style="font-weight: bold;">Probation</div><div><ul><li>Summary Probation<ul><li><b>Term</b>: 3 years</li><li><b>Status</b>: REVOKED</li></ul></li></ul></div>\r\n</div>\r\n',
        driversLicenseConditionsDisplay: '',
        programsDisplay: '',
        confinementsDisplay: '',
      },
    ],
    criminalRegister: '',
  },
  documents: [],
  crossReferences: [
    { caseID: '14901330', number: '01', typeID: 'DAID', typeDescription: 'Prosecutor Defendant ID Number' },
    { caseID: '14901330', number: '1401', typeID: 'RESPAGY', typeDescription: 'Responsible Agency Number' },
    { caseID: '14901330', number: '19430', typeID: 'DMVCRT', typeDescription: 'DMV Court Code' },
    {
      caseID: '14901330',
      number: '199935',
      typeID: 'OCA',
      typeDescription: 'Originating Contributing Agency Number',
    },
    {
      caseID: '14901330',
      number: '201801647',
      typeID: 'LPD',
      typeDescription: 'Local Police Department Number',
    },
    { caseID: '14901330', number: '39604139', typeID: 'DAC', typeDescription: 'Prosecutor Case Number' },
    { caseID: '14901330', number: '417799LB4', typeID: 'FBI', typeDescription: 'FBI Number' },
    { caseID: '14901330', number: '900099', typeID: 'DMVDN', typeDescription: 'DMV Docket Number' },
    { caseID: '14901330', number: 'A19042524', typeID: 'CII', typeDescription: 'CII Number' },
    { caseID: '14901330', number: 'D5209749-CA', typeID: 'DL', typeDescription: "Driver's License Number" },
    { caseID: '14901330', number: 'HU48989', typeID: 'CIT', typeDescription: 'Citation Number' },
  ],
  caseNotes: [],
  message: '',
  caseNumber: 'CIT9WC00099-01',
  caseID: '14901330',
  caseUType: 'Criminal',
  caseUTypeID: 'CR',
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

  console.log(second_query_json)
  const raw_case_json = second_query_json.resultList[0]

  fs.writeFileSync('./raw_case.json', JSON.stringify(raw_case_json))
}

const _case_id = ids[99]

// getRawCaseJson(_case_id)

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

const state = JSON.parse(JSON.stringify(INIT_STATE))

const { caseInfo, parties, otherCriminalInformation, info } = RAW_CASE_JSON

// filter the parties for the defendant

const _defendant = parties.filter((party_member) => {
  if (party_member.partyTypeDescription.includes('Defendant')) return true
  return false
})[0]

const case_info = {}

for (const obj of caseInfo) {
  case_info[obj.key.toLowerCase().replaceAll(' ', '_')] = obj.value
}

console.log(case_info)

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
  if (dispositionCode.includes('CON')) _is_conviction = true

  const structured_charge = {
    count: countNumber,
    charge_code: chargeCode,
    charge_statute: statuteName.split(' ')[0],
    plea: pleaHistoryDisplay,
    disply_last_disposition: lastDispositionDisplay,
    lase_disposition: chargeDispositionDateString,
    is_conviction: _is_conviction,
  }

  return structured_charge
})

const sentencing = otherCriminalInformation.sentencing[0]

const convictions = _charges.filter((charge) => charge.is_conviction)
const first_conviction = convictions[0]

state.case_id = _case_id

state.defendant_name = _defendant.partyName
state.case_title = case_info.case_title
state.charges = _charges
state.date_of_conviction = first_conviction.lase_disposition
state.court_house_location = case_info.filing_courthouse

state.is_misdemeanor = convictions.some((charge) => charge.charge_statute.includes('-M'))
state.is_felony = convictions.some((charge) => charge.charge_statute.includes('-F'))

state.is_probation_granted = sentencing.probation.length >= 1

const probation_info = sentencing.probation[0]

state.probation_status = probation_info.statuses.at(-1).status

console.log(state)
