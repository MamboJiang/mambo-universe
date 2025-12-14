export interface UniverseNode {
  id: string;
  group: number;
  description?: string; // Content for sidebar
  children?: UniverseNode[];
  relations?: Relation[]; // Non-tree links
}

export interface Relation {
  targetId: string;
  type: 'dashed' | 'solid'; // tree links are internal
  label?: string;
  curvature?: number; // Added curvature support
}

export interface GraphNode extends UniverseNode {
  x: number;
  y: number;
  collapsed: boolean;
  childCount: number;
  level: number; // Added level for LOD
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'dashed' | 'solid' | 'tree'; // Added 'tree' type support
  label?: string;
  curvature?: number;
}

// Recursively find a node by ID
export function findNode(root: UniverseNode, id: string): UniverseNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const result = findNode(child, id);
      if (result) return result;
    }
  }
  return null;
}

// Japanese Traditional Colors Palette (20 Levels)
export const JAPANESE_PALETTE = [
  '#FFE082', // 0: Gold
  '#FFB7C5', // 1: Sakura
  '#A5D6A7', // 2: Wasabi
  '#90CAF9', // 3: Sky
  '#B39DDB', // 4: Wisteria
  '#FFAB91', // 5: Coral
  '#80CBC4', // 6: Teal
  '#E6EE9C', // 7: Lime
  '#F48FB1', // 8: Pink
  '#81D4FA', // 9: Light Blue
  '#CE93D8', // 10: Orchid
  '#FFCC80', // 11: Orange
  '#BCAAA4', // 12: Brown
  '#EEEEEE', // 13: Grey
  '#B0BEC5', // 14: Blue Grey
  '#FFF59D', // 15: Yellow
  '#C5E1A5', // 16: Light Green
  '#80DEEA', // 17: Cyan
  '#9FA8DA', // 18: Indigo
  '#EF9A9A'  // 19: Red
];

// Recursive Data Fetcher
export async function fetchUniverseData(url: string = '/data/universe.json'): Promise<UniverseNode> {
  const response = await fetch(url);
  const data = await response.json();

  // Helper to recursively fetch children
  const processNode = async (node: UniverseNode) => {
    if (node.children) {
      const newChildren = await Promise.all(node.children.map(async (child) => {
        if (child.id.endsWith('.json')) {
          // Fetch the linked file
          // Assuming file is at /data/<child.id> if relative, or use logic
          // If id is "Guitar.json", fetch "/data/Guitar.json"
          const childUrl = `/data/${child.id}`;
          const childData = await fetchUniverseData(childUrl);
          return childData; // Replace placeholder with actual data root
        } else {
          await processNode(child);
          return child;
        }
      }));
      node.children = newChildren;
    }
  };

  await processNode(data);
  return data;
}

// Get path from root to a specific node
export function getPathToNode(root: UniverseNode, targetId: string): UniverseNode[] | null {
  if (root.id === targetId) return [root];
  if (root.children) {
    for (const child of root.children) {
      const path = getPathToNode(child, targetId);
      if (path) {
        return [root, ...path];
      }
    }
  }
  return null;
}

export function transformTreeToGraph(data: UniverseNode, collapsedIds: Set<string>, rootId?: string): { nodes: GraphNode[], links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const processedNodes = new Set<string>();

  // Find root node if rootId provided
  let startNode = data;
  if (rootId) {
    // We need to find the node within the tree
    // Simple find logic
    const find = (n: UniverseNode): UniverseNode | undefined => {
      if (n.id === rootId) return n;
      if (n.children) {
        for (const c of n.children) {
          const found = find(c);
          if (found) return found;
        }
      }
    }
    const found = find(data);
    if (found) startNode = found;
  }

  function traverse(node: UniverseNode, x: number, y: number, level: number, parent?: GraphNode) {
    if (processedNodes.has(node.id)) return;
    processedNodes.add(node.id);

    const graphNode: GraphNode = {
      id: node.id,
      group: node.group,
      x, y,
      childCount: node.children?.length || 0,
      collapsed: collapsedIds.has(node.id),
      description: node.description,
      level: level // Add level for LOD
    };
    nodes.push(graphNode);

    if (parent) {
      links.push({ source: parent.id, target: node.id, type: 'tree' });
    }

    // Relations (Cross-links)
    if (node.relations) {
      node.relations.forEach(rel => {
        // We only add link if target exists in current graph. 
        // Since we traverse, we might not have seen target yet. 
        // ForceGraph handles string links, but better to push and filter later or let standard behavior handle it.
        links.push({
          source: node.id,
          target: rel.targetId,
          type: rel.type || 'dashed',
          label: rel.label,
          curvature: rel.curvature
        });
      });
    }

    if (node.children && !graphNode.collapsed) {
      const angleStep = (Math.PI * 2) / node.children.length;
      node.children.forEach((child, index) => {
        const angle = index * angleStep;
        // Spawn children around parent
        traverse(child, x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, level + 1, graphNode);
      });
    }
  }

  traverse(startNode, 0, 0, 0);

  // Filter links where both source/target exist in nodes
  const validNodeIds = new Set(nodes.map(n => n.id));
  const validLinks = links.filter(l => validNodeIds.has(l.source as string) && validNodeIds.has(l.target as string));

  return { nodes, links: validLinks };
}

export function getInitialCollapsedState(data: UniverseNode, depthLimit: number = 100): Set<string> {
  const collapsed = new Set<string>();
  // Default: Expanded (depthLimit high) or user specific
  return collapsed;
}

export function getAllParentIds(data: UniverseNode): Set<string> {
  const parents = new Set<string>();
  function traverse(node: UniverseNode) {
    if (node.children && node.children.length > 0) {
      parents.add(node.id);
      node.children.forEach(traverse);
    }
  }
  traverse(data);
  return parents;
}
