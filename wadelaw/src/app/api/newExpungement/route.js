import nodemailer from 'nodemailer'

import { generateCaseId, getRawCaseJson, getStateFromCase, generateCr181, generateCr180, generateCr106 } from '../index'

const EMAIL = 'threshold.ca.bot@gmail.com'
const PASSWORD = process.env.EMAIL_PASSWORD

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
})

// export const runtime = 'edge'
export const maxDuration = 60 // This function can run for a maximum of 60 seconds

export async function POST(request) {
  const { subject, body_text, sender } = await request.json()

  const origin = request.nextUrl.origin

  console.log('New Expungement request from => ', sender)

  const email_text = `${subject}\n${body_text}`
  console.log(`Email => `, email_text)

  // extract the possible case id from the body or subject
  const case_id = await generateCaseId(email_text)

  if (!case_id) {
    console.log('No case id!')
    // email the client back, telling them we've
    // failed to locate a case id in their email request
    return new Response('[WARN] No case id found in email', { status: 404 })
  }

  console.log('Found case json for => ', case_id)

  // query the la courthouse website with the extracted case_id
  const case_json = await getRawCaseJson(case_id)

  // transform it into our internal state format
  const state = await getStateFromCase(case_id, case_json, origin)

  // fill expungement forms as necessary,
  // email the generated pdfs

  const cr181_output_file = `CR-181_Order_for_Dismissal.pdf`
  const cr180_output_file = `CR-180_Petition_for_Dismissal.pdf`
  const cr106_output_file = `CR-106_Proof_of_Service.pdf`

  const filled_cr181_bytes = await generateCr181(state, origin)
  const filled_cr180_bytes = await generateCr180(state, origin)
  const filled_cr106_bytes = await generateCr106(state, origin)
  // info('Filled form CR-106')
  const _attachment = [
    {
      filename: cr181_output_file,
      content: Buffer.from(filled_cr181_bytes),
    },
    {
      filename: cr180_output_file,
      content: Buffer.from(filled_cr180_bytes),
    },
    {
      filename: cr106_output_file,
      content: Buffer.from(filled_cr106_bytes),
    },
  ]

  // info(`Expungement forms complete for case: ${state.case_id}`)

  const _subject = `[WADE-LAW] Expungement for ${case_id}`
  const _message = `Here are your filled documents for\n${state.case_title}`

  const mail_list = [sender]

  const mail_options = {
    from: EMAIL,
    to: mail_list,
    subject: _subject,
    text: _message,
    attachments: _attachment,
  }

  //   console.log(mail_options)

  try {
    const info = await transporter.sendMail(mail_options)
    console.log('Email sent: ' + info.messageId)
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.log('Failed to send email => ', error)
    return new Response('Email transporter error', { status: 500 })
  }
}
