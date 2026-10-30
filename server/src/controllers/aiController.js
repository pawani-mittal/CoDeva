import { processAIAssist } from '../services/aiService.js';

export async function assistAI(req, res, next) {
  try {
    const { action, prompt, code, language, errorContext } = req.body;

    const validActions = ['generate', 'explain', 'debug', 'improve', 'ask'];
    const chosenAction = validActions.includes(action) ? action : 'ask';

    if (!prompt && !code) {
      return res.status(400).json({
        success: false,
        message: 'Either a user prompt or code context is required.',
      });
    }

    // Set reasonable payload limits (e.g. max 50KB)
    if ((prompt?.length || 0) + (code?.length || 0) > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt and code context exceeds maximum allowed size (50KB).',
      });
    }

    const result = await processAIAssist({
      action: chosenAction,
      prompt,
      code,
      language,
      errorContext,
    });

    if (!result.success && result.configured === false) {
      return res.status(503).json(result);
    }

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}
