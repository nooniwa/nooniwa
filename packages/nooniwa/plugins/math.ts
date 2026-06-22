import type { KatexOptions } from "katex";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function nooniwaMath(userConfig: Partial<KatexOptions> = {}) {
  const katexOptions: Partial<KatexOptions> = {
    throwOnError: false,
    errorColor: "var(--color-error)",
    ...userConfig,
  };
  return {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, katexOptions] as const],
  };
}
