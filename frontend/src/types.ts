export interface TreeNodeData {
  name: string;
  tags: string[];
}

export interface TreeNode {
  id: string;
  data: TreeNodeData;
  children?: string[];
}

export interface Tree {
  items: Record<string, TreeNode>;
}
