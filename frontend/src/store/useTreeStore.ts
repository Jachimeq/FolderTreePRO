import { create } from "zustand";
import { useTreeStore } from "../store/useTreeStore";


interface TreeState {
  tree: Tree;
  setTree: (tree: Tree) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  tree: { items: {} },
  setTree: (tree) => set({ tree }),
}));
