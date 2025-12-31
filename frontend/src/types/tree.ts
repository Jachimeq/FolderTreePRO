export interface TreeNodeData {
  name: string;
  tags: string[];
  path?: string; // optional source path for display
}

export interface TreeNode {
  id: string;
  data: TreeNodeData;
  children?: string[];
}

export interface Tree {
  items: Record<string, TreeNode>;
}
