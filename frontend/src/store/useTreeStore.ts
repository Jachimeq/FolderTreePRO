import { create } from "zustand";
import { loadFolderTree } from "../utils/classify";
import type { Tree, TreeNode } from "../types/tree";

interface HistoryEntry {
  timestamp: number;
  type: 'classify' | 'tag' | 'delete' | 'batch' | 'load' | 'favorite' | 'other';
  description: string;
  previousState: Tree;
  targetNode?: string;
}

interface TreeState {
  tree: Tree;
  history: HistoryEntry[];
  historyIndex: number;
  setTree: (tree: Tree) => void;
  loadTree: (dir: string) => Promise<void>;
  addHistory: (type: HistoryEntry['type'], description: string, targetNode?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => HistoryEntry[];
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: { items: {} },
  history: [],
  historyIndex: -1,
  
  setTree: (tree) => set({ tree }),
  
  loadTree: async (dir: string) => {
    const nodes = await loadFolderTree(dir);
    const items: Record<string, TreeNode> = {};
    nodes.forEach((node: TreeNode) => {
      items[node.id] = node;
    });
    const newTree = { items };
    set({ tree: newTree, history: [], historyIndex: -1 });
  },

  addHistory: (type, description, targetNode) => {
    const state = get();
    const newEntry: HistoryEntry = {
      timestamp: Date.now(),
      type,
      description,
      previousState: JSON.parse(JSON.stringify(state.tree)),
      targetNode,
    };
    
    // Remove any future history if we're not at the end
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newEntry);
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousEntry = state.history[state.historyIndex - 1];
      set({
        tree: JSON.parse(JSON.stringify(previousEntry.previousState)),
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextIndex = state.historyIndex + 1;
      const nextEntry = state.history[nextIndex];
      // Get the state after this operation by reading the next entry's previousState
      // or the final tree state
      let treeAfter = state.tree;
      if (nextIndex + 1 < state.history.length) {
        treeAfter = JSON.parse(JSON.stringify(state.history[nextIndex + 1].previousState));
      } else {
        // This is the last entry - we need to compute the state after it
        treeAfter = JSON.parse(JSON.stringify(state.tree));
      }
      set({
        tree: treeAfter,
        historyIndex: nextIndex,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  getHistory: () => get().history,
}));
