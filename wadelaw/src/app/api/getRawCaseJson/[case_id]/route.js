import { getRawCaseJson } from '../../index'

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
    return new Response(500)
  }

  if (!case_json) {
    console.log('[INFO] No data found => ', case_id)
    // if the api call fails
    return new Response(404)
  }

  return new Response(JSON.stringify(case_json), { status: 200 })
}
