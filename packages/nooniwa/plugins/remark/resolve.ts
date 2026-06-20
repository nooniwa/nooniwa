import { filePathToSlug } from "../../utils/slug";
import { imageNameToKey, type ResolutionMap } from "../../utils/resolution-map";

function calculateProximityScore(
  currentPath: string,
  candidatePath: string,
): number {
  const currentDir = currentPath.replace(/^\//, "").split("/").slice(0, -1);
  const candidateDir = candidatePath.replace(/^\//, "").split("/").slice(0, -1);

  let commonDepth = 0;
  const minLength = Math.min(currentDir.length, candidateDir.length);
  for (let i = 0; i < minLength; i++) {
    if (currentDir[i] === candidateDir[i]) commonDepth++;
    else break;
  }

  const relativeSteps =
    currentDir.length - commonDepth + (candidateDir.length - commonDepth);
  return commonDepth * 100 - relativeSteps;
}

function resolveByProximity(
  candidates: string[],
  currentSlugPath: string,
): string {
  let bestCandidate = candidates[0] ?? "";
  let bestScore = calculateProximityScore(currentSlugPath, bestCandidate);

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate) continue;
    const score = calculateProximityScore(currentSlugPath, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function matchInMap(
  normalizedTarget: string,
  map: ResolutionMap,
  currentSlugPath?: string,
): string | null {
  const result = map[normalizedTarget];
  if (result !== undefined) {
    if (Array.isArray(result)) {
      return currentSlugPath
        ? resolveByProximity(result, currentSlugPath)
        : (result[0] ?? null);
    }
    return result;
  }

  if (normalizedTarget.includes("/")) {
    const suffix = "/" + normalizedTarget;
    const candidates: string[] = [];
    for (const [key, value] of Object.entries(map)) {
      if (key.endsWith(suffix)) {
        candidates.push(...(Array.isArray(value) ? value : [value]));
      }
    }
    if (candidates.length === 1) return candidates[0] ?? null;
    if (candidates.length > 1 && currentSlugPath) {
      return resolveByProximity(candidates, currentSlugPath);
    }
    if (candidates.length > 1) return candidates[0] ?? null;
  }

  return null;
}

export function resolveWikilink(
  target: string,
  pageUrlMap: ResolutionMap,
  currentSlugPath?: string,
  publishedSlugs?: ReadonlySet<string>,
): string | null {
  const slug = matchInMap(filePathToSlug(target), pageUrlMap, currentSlugPath);
  if (slug === null) return null;
  if (publishedSlugs && !publishedSlugs.has(slug)) return null;
  return slug;
}

export function resolveImage(
  target: string,
  imageMap: ResolutionMap,
  currentSlugPath?: string,
): string | null {
  return matchInMap(imageNameToKey(target), imageMap, currentSlugPath);
}
