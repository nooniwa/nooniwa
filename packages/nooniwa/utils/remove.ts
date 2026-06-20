const COMMENT_REGEX = /%%[\s\S]*?%%/g;

const FENCE_REGEX =
  /^[ \t]{0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]{0,3}\1[ \t]*$/gm;
const INLINE_CODE_REGEX = /`[^`\n]*`/g;

export function removeComments(text: string): string {
  return text.replace(COMMENT_REGEX, "");
}

export function removeCode(text: string): string {
  return text.replace(FENCE_REGEX, "").replace(INLINE_CODE_REGEX, "");
}

export function removeCommentsAndCode(text: string): string {
  return removeComments(removeCode(text));
}
