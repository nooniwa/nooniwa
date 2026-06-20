import type { PageLinks } from "./page-links";

export interface GraphNode {
  id: string;
  title: string;
  path: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SerializedGraph extends GraphData {
  currentPath: string;
}

export function buildGraphData(pageLinks: PageLinks[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  for (const page of pageLinks) {
    nodes.push({ id: page.url, title: page.title, path: page.url });
    nodeIds.add(page.url);
  }

  const seenEdges = new Set<string>();
  for (const page of pageLinks) {
    for (const target of page.targets) {
      if (!nodeIds.has(target)) continue;

      const edgeKey =
        page.url < target ? `${page.url} ${target}` : `${target} ${page.url}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      links.push({ source: page.url, target });
    }
  }

  return { nodes, links };
}

export function getLocalGraph(
  graphData: GraphData,
  currentPath: string,
  depth: number = 1,
): GraphData {
  const connectedNodes = new Set<string>();
  connectedNodes.add(currentPath);

  let frontier = [currentPath];

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = [];

    for (const nodeId of frontier) {
      for (const link of graphData.links) {
        if (link.source === nodeId && !connectedNodes.has(link.target)) {
          connectedNodes.add(link.target);
          nextFrontier.push(link.target);
        }
        if (link.target === nodeId && !connectedNodes.has(link.source)) {
          connectedNodes.add(link.source);
          nextFrontier.push(link.source);
        }
      }
    }

    frontier = nextFrontier;
  }

  const connectedLinks: GraphLink[] = [];
  for (const link of graphData.links) {
    if (connectedNodes.has(link.source) && connectedNodes.has(link.target)) {
      connectedLinks.push(link);
    }
  }

  const localNodes = graphData.nodes.filter((n) => connectedNodes.has(n.id));

  return { nodes: localNodes, links: connectedLinks };
}
