const useColor = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"];

export function blue(text: string): string {
  return useColor ? `\x1b[34m${text}\x1b[39m` : text;
}
