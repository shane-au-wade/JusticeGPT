import { resolvePDFJS } from 'pdfjs-serverless'

export async function GET(request) {
  const pdfjs = await resolvePDFJS()

  const pdf_res = await fetch(
    `${request.nextUrl.origin}/courthouses/Courthouses_in_Los_Angeles_County_Contacts_and_Locations_LA_Court.pdf`
  )
  const courthouses_pdf = await pdfjs.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

  console.log(courthouses_pdf._pdfInfo)

  return new Response(JSON.stringify(courthouses_pdf._pdfInfo), { status: 200 })
}
