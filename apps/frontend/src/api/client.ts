const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? "http://localhost:3333";

async function request<T>(path: string, options: RequestInit): Promise<{ data: T }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message ?? "API request failed");
  }

  const data = await response.json();
  return { data };
}

export const client = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export async function postJson<TInput, TOutput>(path: string, body: TInput): Promise<TOutput> {
  const { data } = await client.post<TOutput>(path, body);
  return data;
}
