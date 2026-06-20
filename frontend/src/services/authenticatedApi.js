import { supabase } from "./supabaseClient";

export async function authenticatedJson(path, options = {}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const {
    timeoutMs = 20_000,
    signal: externalSignal,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("request-timeout"), timeoutMs);
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  const abortPromise = new Promise((_, reject) => {
    controller.signal.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }, { once: true });
  });

  try {
    const { data: sessionData, error: sessionError } = await Promise.race([
      supabase.auth.getSession(),
      abortPromise,
    ]);
    const token = sessionData?.session?.access_token;
    if (sessionError || !token) {
      return { data: null, error: new Error("An authenticated session is required.") };
    }

    const response = await fetch(path, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(fetchOptions.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.message || payload.error || "API request failed.");
      error.status = response.status;
      error.code = payload.code || null;
      return { data: null, error };
    }
    return { data: payload.data ?? payload, error: null };
  } catch (error) {
    const timedOut = controller.signal.aborted && controller.signal.reason === "request-timeout";
    const requestError = error instanceof Error ? error : new Error("API request failed.");
    requestError.code = timedOut ? "REQUEST_TIMEOUT" : "BACKEND_UNAVAILABLE";
    if (timedOut) {
      requestError.message = "The server took too long to respond. Please try again.";
    }
    return { data: null, error: requestError };
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }
}
