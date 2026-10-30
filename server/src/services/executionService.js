import { env } from '../config/env.js';

// Standard Judge0 CE language mapping
// Can be customized via environment or parameters
const LANGUAGE_IDS = {
  javascript: 93, // Node.js 18.15.0 (or 63)
  python: 71, // Python (3.8.1) or 92 (3.11.2)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  c: 50, // C (GCC 9.2.0)
};

export async function executeCode({ code, language, stdin = '' }) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      success: false,
      message: 'Source code cannot be empty.',
    };
  }

  const normalizedLang = (language || 'javascript').toLowerCase();
  const languageId = LANGUAGE_IDS[normalizedLang];

  if (!languageId) {
    return {
      success: false,
      message: `Language '${language}' is not supported for execution. Supported languages: ${Object.keys(LANGUAGE_IDS).join(', ')}`,
    };
  }

  const baseUrl = (env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/+$/, '');

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (env.JUDGE0_API_KEY) {
    // If using RapidAPI endpoint
    if (baseUrl.includes('rapidapi.com')) {
      headers['X-RapidAPI-Key'] = env.JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] = new URL(baseUrl).host;
    } else {
      headers[env.JUDGE0_AUTH_HEADER || 'X-Auth-Token'] = env.JUDGE0_API_KEY;
    }
  }

  const payload = {
    source_code: code,
    language_id: languageId,
    stdin: stdin || '',
    cpu_time_limit: 5,
    memory_limit: 128000,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Call Judge0 submission with wait=true for synchronous response
    const submitUrl = `${baseUrl}/submissions?base64_encoded=false&wait=true`;
    console.log(`[ExecutionService] Submitting ${normalizedLang} code to ${submitUrl}`);

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[ExecutionService] Judge0 returned status ${res.status}:`, errorText);

      // Helpful advice on missing credentials or endpoint rate-limits
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          configured: false,
          message:
            'Judge0 authentication failed. Please configure valid JUDGE0_API_KEY and JUDGE0_URL in server/.env.',
          details: errorText,
        };
      }

      return {
        success: false,
        message: `Execution service returned status ${res.status}: ${res.statusText}`,
        details: errorText,
      };
    }

    const data = await res.json();

    // Map Judge0 status response
    // Status ids: 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error, 11 = Runtime Error, etc.
    const statusDesc = data.status?.description || 'Completed';
    const isSuccess = data.status?.id === 3;

    return {
      success: true,
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      compile_output: data.compile_output || '',
      status: statusDesc,
      statusId: data.status?.id,
      time: data.time ? `${data.time}s` : 'N/A',
      memory: data.memory ? `${data.memory} KB` : 'N/A',
      isError: !isSuccess && (!!data.stderr || !!data.compile_output || data.status?.id > 3),
    };
  } catch (err) {
    console.error('[ExecutionService] Connection error:', err.message);

    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Execution request timed out after 15 seconds.',
      };
    }

    return {
      success: false,
      message: `Failed to connect to Judge0 execution provider at ${baseUrl}. Ensure server has network access and JUDGE0_URL is properly configured.`,
      error: err.message,
    };
  }
}
