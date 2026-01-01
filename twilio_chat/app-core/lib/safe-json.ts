export async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got '${ct}'. Status ${res.status}. Snippet: ${text.slice(0, 200)}`
    );
  }
  return res.json();
}
