export async function POST(request) {
  const { subject, body_text, sender } = await request.json();

  console.log("New Expungement request from => ", sender);

  console.log(`${subject}\n${body_text}`);


  return new Response(200)
}
