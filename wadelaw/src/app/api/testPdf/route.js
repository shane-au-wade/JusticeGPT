import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs'
await import('pdfjs-dist/build/pdf.worker.mjs')

export async function GET(request) {
  const pdf_res = await fetch(
    `${request.nextUrl.origin}/courthouses/Courthouses_in_Los_Angeles_County_Contacts_and_Locations_LA_Court.pdf`
  )
  const courthouses_pdf = await pdfjsLib.getDocument({
    url: '',
    data: await pdf_res.arrayBuffer(),
  }).promise

  console.log(courthouses_pdf._pdfInfo)

  return new Response.json(courthouses_pdf._pdfInfo)
}
