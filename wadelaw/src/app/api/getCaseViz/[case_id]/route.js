import { getRawCaseJson, getRawJsonViz } from '../../index'

export async function GET(request, { params }) {
  const { case_id } = params
  console.log('[INFO] getCaseViz => ', case_id)

  let case_json
  try {
    // search the id via the public courthouse api
    case_json = await getRawCaseJson(case_id)
  } catch (error) {
    console.error(error)
    console.log('[ERROR] Query failed => ', case_id)
    return new Response(
      JSON.stringify({ markdown_text: '### Courthose query failed\n\nCheck case id and try again.', case_json: {} }),
      { status: 500 }
    )
  }

  if (!case_json) {
    console.log('[INFO] No data found => ', case_id)
    // if the api call fails
    return new Response(
      JSON.stringify({ markdown_text: '### Courthose query failed\n\nCheck case id and try again.', case_json: {} }),
      { status: 500 }
    )
  }

  let markdown_text
  try {
    markdown_text = getRawJsonViz(case_json)
  } catch (e) {
    console.log(e)
    markdown_text = '### Unable to generate markdown viz'
  }

  const data = {
    markdown_text: markdown_text,
    case_json: case_json,
  }

  return new Response(JSON.stringify(data))
}
