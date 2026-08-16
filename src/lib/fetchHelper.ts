/**
 * Helper to safely parse JSON responses from fetch calls.
 * Prevents "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" errors
 * when an endpoint returns an HTML page (e.g. 404 Not Found, 500 Internal Error, or Redirect).
 */
export async function safeFetchJson<T = any>(
  url: string | URL | Request,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null; ok: boolean; status: number }> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      const summary = text.slice(0, 100).replace(/\s+/g, " ");
      return {
        data: null,
        error: `Server returned non-JSON response (${res.status} ${res.statusText || ""}). ${summary ? `Preview: ${summary}` : ""}`,
        ok: false,
        status: res.status,
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        data,
        error: data?.error || data?.message || `Request failed with status ${res.status}`,
        ok: false,
        status: res.status,
      };
    }

    return { data, error: null, ok: true, status: res.status };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || "Network or request error",
      ok: false,
      status: 0,
    };
  }
}

/**
 * Helper to safely extract JSON from an existing fetch Response object.
 */
export async function safeJsonResponse<T = any>(res: Response): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  try {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      return {
        data: null,
        error: `Server returned non-JSON response (${res.status} ${res.statusText || ""}).`,
        ok: false,
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        data,
        error: data?.error || data?.message || `HTTP ${res.status}`,
        ok: res.ok,
      };
    }

    return { data, error: null, ok: true };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || "Failed to parse JSON response",
      ok: false,
    };
  }
}
