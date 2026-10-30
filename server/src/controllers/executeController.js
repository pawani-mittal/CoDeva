import { executeCode } from '../services/executionService.js';

export async function runCode(req, res, next) {
  try {
    const { code, language, stdin = '' } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No code provided for execution.',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language must be specified (e.g. javascript, python, cpp, java).',
      });
    }

    if (code.length > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Code length exceeds maximum allowed limit (100KB).',
      });
    }

    const result = await executeCode({
      code,
      language,
      stdin,
    });

    if (!result.success && result.configured === false) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}
