import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceRadial,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import type { GraphNode } from "../utils/graph";

const graphInstances = new Map<string, () => void>();

let activeGraphId: string | null = null;

export function cleanupGraphInstance(id: string): void {
  const cleanup = graphInstances.get(id);
  if (cleanup) {
    cleanup();
    graphInstances.delete(id);
  }
  if (activeGraphId === id) {
    activeGraphId = null;
  }
}

export function cleanupAllGraphInstances(): void {
  graphInstances.forEach((cleanup) => cleanup());
  graphInstances.clear();
  activeGraphId = null;
}

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SimLink {
  source: SimNode | string;
  target: SimNode | string;
}

export interface GraphRenderOptions {
  instanceId: string;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  nodes: SimNode[];
  links: SimLink[];
  currentPath: string;
  isGlobal?: boolean;
  onNavigate?: (path: string) => void;
}

function getColors() {
  const style = getComputedStyle(document.documentElement);

  const get = (name: string) =>
    normalizeToOklch(style.getPropertyValue(name).trim());

  return {
    node: get("--color-graph-node"),
    nodeHover: get("--color-graph-node-hover"),
    link: get("--color-graph-link"),
    linkHover: get("--color-graph-link-hover"),
    text: get("--color-graph-text"),
    textHover: get("--color-graph-text-hover"),
  };
}

function lerp(
  current: number,
  target: number,
  speed: number,
  deltaTime: number,
): number {
  const normalizedSpeed = 1 - Math.pow(1 - speed, deltaTime / 16.67);
  return current + (target - current) * normalizedSpeed;
}

interface OklchColor {
  l: number;
  c: number;
  h: number;
}

function parseOklch(color: string): OklchColor | null {
  const match = color.match(
    /oklch\(\s*([.\d]+)(%?)\s+([.\d]+)\s+(none|[-.\d]+)(deg)?\s*(?:\/\s*[.\d]+%?)?\s*\)/i,
  );
  if (!match) return null;

  let l = parseFloat(match[1]!);
  const hasPercent = match[2] === "%";
  if (!hasPercent && l <= 1) {
    l = l * 100;
  }

  const c = parseFloat(match[3]!);

  let h = match[4] === "none" ? 0 : parseFloat(match[4]!);

  h = ((h % 360) + 360) % 360;

  return { l, c, h };
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1]!, 16),
        parseInt(result[2]!, 16),
        parseInt(result[3]!, 16),
      ]
    : [0, 0, 0];
}

function hexToOklch(hex: string): OklchColor {
  const [r, g, b] = hexToRgb(hex);

  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(sr);
  const lg = toLinear(sg);
  const lb = toLinear(sb);

  const l_ = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m_ = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s_ = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  const okL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const okA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(okA * okA + okB * okB);
  let h = (Math.atan2(okB, okA) * 180) / Math.PI;
  if (h < 0) h += 360;

  return {
    l: okL * 100,
    c: c,
    h: h,
  };
}

function normalizeToOklch(color: string): string {
  if (color.startsWith("oklch")) {
    return color;
  }

  if (color.startsWith("#")) {
    const { l, c, h } = hexToOklch(color);
    return `oklch(${l}% ${c} ${h})`;
  }

  return color;
}

function lerpColor(
  current: string,
  target: string,
  speed: number,
  deltaTime: number,
): string {
  const c1 = parseOklch(current);
  const c2 = parseOklch(target);

  if (!c1 || !c2) {
    return target;
  }

  const newL = lerp(c1.l, c2.l, speed, deltaTime);
  const newC = lerp(c1.c, c2.c, speed, deltaTime);

  const CHROMA_THRESHOLD = 0.02;
  const newH = c2.c < CHROMA_THRESHOLD ? c1.h : c2.h;

  return `oklch(${newL}% ${newC} ${newH})`;
}

function colorsAreClose(
  color1: string,
  color2: string,
  threshold = 1,
): boolean {
  if (color1 === color2) return true;

  const c1 = parseOklch(color1);
  const c2 = parseOklch(color2);

  if (!c1 || !c2) return true;

  return (
    Math.abs(c1.l - c2.l) <= threshold &&
    Math.abs(c1.c - c2.c) <= threshold * 0.01 &&
    Math.abs(c1.h - c2.h) <= threshold
  );
}

export function renderGraph(options: GraphRenderOptions): () => void {
  const {
    instanceId,
    canvas,
    container,
    currentPath,
    isGlobal = false,
    onNavigate,
  } = options;

  cleanupAllGraphInstances();

  activeGraphId = instanceId;

  const nodes: SimNode[] = options.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    path: n.path,
  }));
  const links: SimLink[] = options.links.map((l) => ({
    source: typeof l.source === "string" ? l.source : l.source.id,
    target: typeof l.target === "string" ? l.target : l.target.id,
  }));

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  if (nodes.length === 0) {
    ctx.fillStyle =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--text-muted",
      ) || "#9ca3af";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No connections", width / 2, height / 2);
    return () => {};
  }

  let colors = getColors();

  const nodeAlphas: Map<string, number> = new Map();
  const linkAlphas: Map<string, number> = new Map();
  const nodeColors: Map<string, string> = new Map();
  const linkColors: Map<string, string> = new Map();
  const labelColors: Map<string, string> = new Map();
  const labelOffsets: Map<string, number> = new Map();
  const TRANSITION_SPEED = 0.08;

  const MUTED_ALPHA = 0.2;

  nodes.forEach((n) => {
    nodeAlphas.set(n.id, 1);
    nodeColors.set(n.id, colors.node);
    labelColors.set(n.id, colors.text);
    labelOffsets.set(n.id, 0);
  });
  links.forEach((_, i) => {
    linkAlphas.set(String(i), 1);
    linkColors.set(String(i), colors.link);
  });

  const linkDistance = isGlobal ? 60 : 80;
  const chargeStrength = isGlobal ? -80 : -150;
  const collideRadius = isGlobal ? 25 : 35;

  const simulation = forceSimulation<SimNode>(nodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(linkDistance),
    )
    .force("charge", forceManyBody().strength(chargeStrength))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(collideRadius));

  if (isGlobal) {
    simulation.force(
      "radial",
      forceRadial(
        Math.min(width, height) * 0.15,
        width / 2,
        height / 2,
      ).strength(0.1),
    );
  }

  let transform = zoomIdentity;
  let hoveredNode: SimNode | null = null;
  let isDragging = false;
  let draggedNode: SimNode | null = null;
  let animationFrameId: number | null = null;
  let lastRenderTime = 0;

  let isCleanedUp = false;

  function resetColorsToDefault() {
    nodes.forEach((n) => {
      nodeColors.set(n.id, colors.node);
      labelColors.set(n.id, colors.text);
      labelOffsets.set(n.id, 0);
    });
    links.forEach((_, i) => linkColors.set(String(i), colors.link));
  }

  function render(animate = false) {
    if (isCleanedUp || !ctx) return;

    const now = performance.now();
    const deltaTime = lastRenderTime > 0 ? now - lastRenderTime : 16.67;
    lastRenderTime = now;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    let needsAnimation = false;

    links.forEach((link, index) => {
      const source = link.source as SimNode;
      const target = link.target as SimNode;
      if (
        source.x == null ||
        source.y == null ||
        target.x == null ||
        target.y == null
      )
        return;

      const hoveredId = hoveredNode?.id;
      const isHovered =
        hoveredId && (source.id === hoveredId || target.id === hoveredId);
      const targetAlpha = hoveredId && !isHovered ? MUTED_ALPHA : 1;
      const linkKey = String(index);

      let currentAlpha = linkAlphas.get(linkKey) ?? 1;
      if (animate && Math.abs(currentAlpha - targetAlpha) > 0.01) {
        currentAlpha = lerp(
          currentAlpha,
          targetAlpha,
          TRANSITION_SPEED,
          deltaTime,
        );
        linkAlphas.set(linkKey, currentAlpha);
        needsAnimation = true;
      } else {
        linkAlphas.set(linkKey, targetAlpha);
        currentAlpha = targetAlpha;
      }

      const targetColor = isHovered ? colors.linkHover : colors.link;
      let currentColor = linkColors.get(linkKey) ?? colors.link;
      if (animate && !colorsAreClose(currentColor, targetColor)) {
        currentColor = lerpColor(
          currentColor,
          targetColor,
          TRANSITION_SPEED,
          deltaTime,
        );
        if (colorsAreClose(currentColor, targetColor)) {
          linkColors.set(linkKey, targetColor);
          currentColor = targetColor;
        } else {
          linkColors.set(linkKey, currentColor);
          needsAnimation = true;
        }
      } else {
        linkColors.set(linkKey, targetColor);
        currentColor = targetColor;
      }

      ctx.globalAlpha = currentAlpha;
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 0.3;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    const baseFontSize = 9;
    const scaledFontSize = Math.max(
      8,
      Math.min(12, baseFontSize * transform.k),
    );
    const fontSize = scaledFontSize / transform.k;

    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;

      const isCurrent = node.path === currentPath;
      const hoveredId = hoveredNode?.id;
      const isHovered = hoveredId === node.id;
      const isConnected =
        hoveredId &&
        links.some((l) => {
          const s = (l.source as SimNode).id;
          const t = (l.target as SimNode).id;
          return (
            (s === hoveredId && t === node.id) ||
            (t === hoveredId && s === node.id)
          );
        });

      let radius = isCurrent ? 6 : 3;
      if (isHovered) radius += 0.5;

      const isRelevant = !hoveredNode || isHovered || isConnected;
      const targetAlpha = isRelevant ? 1 : MUTED_ALPHA;

      let currentAlpha = nodeAlphas.get(node.id) ?? 1;
      if (animate && Math.abs(currentAlpha - targetAlpha) > 0.01) {
        currentAlpha = lerp(
          currentAlpha,
          targetAlpha,
          TRANSITION_SPEED,
          deltaTime,
        );
        nodeAlphas.set(node.id, currentAlpha);
        needsAnimation = true;
      } else {
        nodeAlphas.set(node.id, targetAlpha);
        currentAlpha = targetAlpha;
      }

      ctx.globalAlpha = currentAlpha;

      const targetNodeColor = isHovered ? colors.nodeHover : colors.node;
      let currentNodeColor = nodeColors.get(node.id) ?? colors.node;
      if (animate && !colorsAreClose(currentNodeColor, targetNodeColor)) {
        currentNodeColor = lerpColor(
          currentNodeColor,
          targetNodeColor,
          TRANSITION_SPEED,
          deltaTime,
        );
        if (colorsAreClose(currentNodeColor, targetNodeColor)) {
          nodeColors.set(node.id, targetNodeColor);
          currentNodeColor = targetNodeColor;
        } else {
          nodeColors.set(node.id, currentNodeColor);
          needsAnimation = true;
        }
      } else {
        nodeColors.set(node.id, targetNodeColor);
        currentNodeColor = targetNodeColor;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = currentNodeColor;
      ctx.fill();

      const targetLabelColor = isHovered ? colors.textHover : colors.text;
      let currentLabelColor = labelColors.get(node.id) ?? colors.text;
      if (animate && !colorsAreClose(currentLabelColor, targetLabelColor)) {
        currentLabelColor = lerpColor(
          currentLabelColor,
          targetLabelColor,
          TRANSITION_SPEED,
          deltaTime,
        );
        if (colorsAreClose(currentLabelColor, targetLabelColor)) {
          labelColors.set(node.id, targetLabelColor);
          currentLabelColor = targetLabelColor;
        } else {
          labelColors.set(node.id, currentLabelColor);
          needsAnimation = true;
        }
      } else {
        labelColors.set(node.id, targetLabelColor);
        currentLabelColor = targetLabelColor;
      }

      const targetLabelOffset = isHovered ? 5 : 0;
      let currentLabelOffset = labelOffsets.get(node.id) ?? 0;
      if (animate && Math.abs(currentLabelOffset - targetLabelOffset) > 0.1) {
        currentLabelOffset = lerp(
          currentLabelOffset,
          targetLabelOffset,
          TRANSITION_SPEED,
          deltaTime,
        );
        labelOffsets.set(node.id, currentLabelOffset);
        needsAnimation = true;
      } else {
        labelOffsets.set(node.id, targetLabelOffset);
        currentLabelOffset = targetLabelOffset;
      }

      ctx.fillStyle = currentLabelColor;
      ctx.font = `${isHovered ? "bold " : ""}${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const maxTitleLength = isHovered ? 25 : 12;
      const displayTitle =
        node.title.length > maxTitleLength
          ? node.title.substring(0, maxTitleLength - 1) + "…"
          : node.title;
      ctx.fillText(
        displayTitle,
        node.x,
        node.y + radius + 3 + currentLabelOffset,
      );
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    if (needsAnimation) {
      animationFrameId = requestAnimationFrame(() => render(true));
    } else if (!hoveredNode) {
      resetColorsToDefault();
    }
  }

  function startTransition() {
    if (isCleanedUp) return;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    lastRenderTime = 0;
    animationFrameId = requestAnimationFrame(() => render(true));
  }

  simulation.on("tick", () => {
    if (isCleanedUp) return;
    render(true);
  });

  function findNode(x: number, y: number): SimNode | null {
    const tx = (x - transform.x) / transform.k;
    const ty = (y - transform.y) / transform.k;

    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;
      const dx = tx - node.x;
      const dy = ty - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) return node;
    }
    return null;
  }

  const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.2, 4])
    .filter((event) => {
      if (isCleanedUp) return false;
      if (event.type === "wheel") return true;
      if (hoveredNode) return false;
      return true;
    })
    .on("zoom", (event) => {
      if (isCleanedUp) return;
      transform = event.transform;
      render();
    });

  const canvasSelection = select<HTMLCanvasElement, unknown>(canvas);
  canvasSelection.call(zoomBehavior);

  if (isGlobal && nodes.length > 10) {
    const initialScale = Math.max(0.3, Math.min(1, 10 / nodes.length + 0.3));
    const initialTransform = zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initialScale)
      .translate(-width / 2, -height / 2);
    canvasSelection.call(zoomBehavior.transform, initialTransform);
  } else {
    canvasSelection.call(zoomBehavior.transform, zoomIdentity);
  }

  const endDrag = () => {
    document.removeEventListener("mousemove", handleDocumentMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);

    if (isCleanedUp) return;

    if (isDragging && draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      simulation.alphaTarget(0);
      isDragging = false;
      draggedNode = null;
    }
  };

  const handleDocumentMouseMove = (event: MouseEvent) => {
    if (isCleanedUp) return;
    if (!isDragging || !draggedNode) return;
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    draggedNode.fx = (x - transform.x) / transform.k;
    draggedNode.fy = (y - transform.y) / transform.k;
  };

  const handleDocumentMouseUp = () => {
    if (isCleanedUp) return;

    const wasDragging = isDragging;
    endDrag();

    if (wasDragging) {
      hoveredNode = null;
      canvas.style.cursor = "grab";
      startTransition();
    }
  };

  let mouseDownTime = 0;

  const handleCanvasMouseDown = (event: MouseEvent) => {
    if (isCleanedUp) return;
    mouseDownTime = Date.now();
    if (!hoveredNode) return;
    event.stopPropagation();
    isDragging = true;
    draggedNode = hoveredNode;
    hoveredNode.fx = hoveredNode.x ?? null;
    hoveredNode.fy = hoveredNode.y ?? null;
    simulation.alphaTarget(0.3).restart();
    canvas.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
  };

  const handleCanvasMouseMove = (event: MouseEvent) => {
    if (isCleanedUp) return;
    if (isDragging) return;
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    const node = findNode(x, y);
    if (node !== hoveredNode) {
      hoveredNode = node;
      canvas.style.cursor = node ? "pointer" : "grab";
      startTransition();
    }
  };

  const handleCanvasMouseUp = () => {
    if (isCleanedUp) return;

    const wasDragging = isDragging;
    endDrag();

    if (wasDragging) {
      hoveredNode = null;
      canvas.style.cursor = "grab";
      startTransition();
    }
  };

  const handleCanvasMouseLeave = () => {
    if (isCleanedUp) return;
    if (!isDragging) {
      hoveredNode = null;
      startTransition();
    }
  };

  const handleCanvasClick = (event: MouseEvent) => {
    if (isCleanedUp) return;
    if (Date.now() - mouseDownTime > 200) return;
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    const node = findNode(x, y);
    if (node && node.path !== currentPath) {
      if (onNavigate) {
        onNavigate(node.path);
      } else {
        window.location.href = node.path;
      }
    }
  };

  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
  canvas.addEventListener("mouseleave", handleCanvasMouseLeave);
  canvas.addEventListener("click", handleCanvasClick);

  render();

  const observer = new MutationObserver((mutations) => {
    if (isCleanedUp) return;
    for (const mutation of mutations) {
      if (mutation.attributeName === "class") {
        colors = getColors();
        resetColorsToDefault();
        startTransition();
        break;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });

  const cleanup = () => {
    isCleanedUp = true;

    graphInstances.delete(instanceId);

    if (isDragging && draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
    }
    isDragging = false;
    draggedNode = null;
    hoveredNode = null;

    document.removeEventListener("mousemove", handleDocumentMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);

    canvas.removeEventListener("mousedown", handleCanvasMouseDown);
    canvas.removeEventListener("mousemove", handleCanvasMouseMove);
    canvas.removeEventListener("mouseup", handleCanvasMouseUp);
    canvas.removeEventListener("mouseleave", handleCanvasMouseLeave);
    canvas.removeEventListener("click", handleCanvasClick);

    canvasSelection.on(".zoom", null);

    simulation.stop();
    observer.disconnect();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  graphInstances.set(instanceId, cleanup);

  return cleanup;
}
