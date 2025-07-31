import React from "react";
import { useTreeStore } from "../store/useTreeStore";
import { classifyContent } from "../utils/classify";
import { TreeNode } from "../types";

export default function FolderTreeUI() {
  const { tree, setTree } = useTreeStore();

  const handleClassify = async (node: TreeNode) => {
    const tags = await classifyContent(node.data.name);
    const updated = [...(node.data.tags || []), ...tags];

    setTree({
      ...tree,
      items: {
        ...tree.items,
        [node.id]: {
          ...node,
          data: {
            ...node.data,
            tags: updated
          }
        }
      }
    });
  };

  const classifyAll = async () => {
    for (const node of Object.values(tree.items)) {
      await handleClassify(node);
    }
  };

  const exportTree = () => {
    const json = JSON.stringify(tree, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "foldertree.json";
    a.click();
  };

  return (
    <div className="p-4">
      <div className="space-x-2 mb-4">
        <button onClick={classifyAll}>Klasyfikuj wszystko</button>
        <button onClick={exportTree}>Eksportuj JSON</button>
        <button onClick={async () => alert((await classifyContent("faktura")).join(", "))}>Test AI</button>
      </div>
      {Object.values(tree.items).map((node) => (
        <div
          key={node.id}
          onClick={() => handleClassify(node)}
          style={{
            border: "1px solid #ccc",
            padding: "8px",
            marginBottom: "4px",
            cursor: "pointer"
          }}
        >
          <div><strong>{node.data.name}</strong></div>
          <div>
            {node.data.tags.map((t, i) => (
              <span
                key={i}
                style={{
                  background: "#d4f4dd",
                  marginRight: "4px",
                  padding: "2px 4px"
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
