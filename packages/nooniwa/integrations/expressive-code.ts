import {
  astroExpressiveCode,
  type AstroExpressiveCodeOptions,
} from "astro-expressive-code";
import type { AstroIntegration } from "astro";

export function nooniwaExpressiveCode(
  userConfig: Partial<AstroExpressiveCodeOptions> = {},
): AstroIntegration {
  const {
    themes = ["github-light", "github-dark"],
    styleOverrides: {
      frames: userFramesStyles,
      textMarkers: userTextMarkers,
      ...userStyleOverrides
    } = {},
    ...rest
  } = userConfig;

  return astroExpressiveCode({
    themes,
    frames: {
      removeCommentsWhenCopyingTerminalFrames: false,
    },
    styleOverrides: {
      borderRadius: "0px",
      borderWidth: "1px",
      codePaddingBlock: "0.75rem",
      codePaddingInline: "1rem",
      codeFontFamily: "var(--font-mono)",
      codeFontSize: "0.875em",
      codeLineHeight: "1.6",
      frames: {
        frameBoxShadowCssValue: "none",
        inlineButtonBorderOpacity: "0",
        ...userFramesStyles,
      },
      textMarkers: {
        lineDiffIndicatorMarginLeft: "0.25rem",
        defaultChroma: "45",
        backgroundOpacity: "60%",
        ...userTextMarkers,
      },
      ...userStyleOverrides,
    },
    ...rest,
    themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  });
}
