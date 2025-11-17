export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch('https://three1labs-backend.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    return Response.json(await response.json());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
