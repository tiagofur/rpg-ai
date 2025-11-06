const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333";

export async function postJson<TInput, TOutput>(path: string, body: TInput): Promise<TOutput> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message ?? "API request failed");
  }

  return response.json();
}
