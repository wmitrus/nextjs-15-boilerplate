import xss from 'xss';

// Strict sanitizer: disallow HTML, strip scripts/styles entirely
export function sanitizeInput(input: string): string {
  return xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}
