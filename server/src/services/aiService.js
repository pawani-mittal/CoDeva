import OpenAI from 'openai';
import { env } from '../config/env.js';

let openaiClient = null;

function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export async function processAIAssist({ action, prompt, code, language, errorContext }) {
  if (!env.OPENAI_API_KEY) {
    return {
      success: false,
      configured: false,
      message:
        'OpenAI API Key is not configured on the server. Please add your OPENAI_API_KEY to server/.env to enable live AI assistance.',
    };
  }

  const client = getOpenAIClient();

  const systemInstructions = {
    generate: `You are an expert software engineer in CoDeva. Your task is to generate clean, robust, and well-commented code in ${language || 'the requested language'} based on the user's specification. Return the code clearly formatted in markdown code blocks with concise explanations.`,
    explain: `You are a patient senior software engineer. Explain the provided code step-by-step, highlighting key algorithmic choices, time/space complexity, and architecture. Be clear and educational.`,
    debug: `You are a debugging expert. Analyze the provided code and any accompanying error messages. Identify the root cause of any bug, potential edge case failures, and provide the exact corrected code block along with an explanation of the fix.`,
    improve: `You are a code review specialist. Suggest readability, maintainability, architectural, and performance improvements for the provided code. Provide before/after refactorings where appropriate.`,
    ask: `You are an AI programming tutor inside the CoDeva collaborative IDE. Answer the user's technical question thoroughly and accurately, with code examples where relevant.`,
  };

  const systemMessage =
    systemInstructions[action] ||
    `You are an AI programming assistant in CoDeva. Assist the user with coding in ${language || 'code'}.`;

  const userContent = [
    `Action: ${action}`,
    language ? `Language: ${language}` : '',
    code ? `--- CURRENT CODE ---\n\`\`\`${language || ''}\n${code}\n\`\`\`` : '',
    errorContext ? `--- ERROR/OUTPUT CONTEXT ---\n${errorContext}` : '',
    prompt ? `--- USER REQUEST ---\n${prompt}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userContent },
      ],
      temperature: action === 'generate' || action === 'debug' ? 0.2 : 0.4,
      max_tokens: 2048,
    });

    const reply = response.choices?.[0]?.message?.content || 'No response generated.';

    return {
      success: true,
      configured: true,
      action,
      model: env.OPENAI_MODEL,
      reply,
    };
  } catch (err) {
    console.error('[AIService] OpenAI Error:', err.message);

    let clientMsg = 'An error occurred while contacting the AI service.';
    if (err.status === 401) {
      clientMsg = 'Invalid OpenAI API key. Please check your credentials in server/.env.';
    } else if (err.status === 429) {
      clientMsg = 'OpenAI rate limit or quota exceeded. Please check your account limits.';
    } else if (err.code === 'ETIMEDOUT' || err.status === 504) {
      clientMsg = 'AI request timed out. Please try again.';
    }

    return {
      success: false,
      configured: true,
      message: clientMsg,
      error: err.message,
    };
  }
}
