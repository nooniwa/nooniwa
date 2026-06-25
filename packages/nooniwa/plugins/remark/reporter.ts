import type { AstroIntegrationLogger } from "astro";
import type { Node } from "unist";
import path from "node:path";
import { blue } from "../../utils/terminal";

export interface Reporter {
  info(message: string, node?: Node): void;
  error(message: string, node?: Node): void;
}

export function createReporter(
  logger: AstroIntegrationLogger | undefined,
  file: { path?: string },
): Reporter {
  const fileLabel = file.path
    ? path.relative(process.cwd(), file.path)
    : undefined;

  const emit = (level: "info" | "error", message: string, node?: Node) => {
    const place = formatPlace(fileLabel, node);
    const text = place ? `${message} (${blue(place)})` : message;
    if (logger) {
      logger[level](text);
    } else {
      console[level](`[nooniwa] ${text}`);
    }
  };

  return {
    info: (message, node) => emit("info", message, node),
    error: (message, node) => emit("error", message, node),
  };
}

function formatPlace(fileLabel: string | undefined, node?: Node): string {
  if (!fileLabel) return "";
  const start = node?.position?.start;
  if (start?.line && start.column) {
    return `${fileLabel}:${start.line}:${start.column}`;
  }
  if (start?.line) return `${fileLabel}:${start.line}`;
  return fileLabel;
}
