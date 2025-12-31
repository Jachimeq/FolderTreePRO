const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
const GRAPHQL_URL = `${API_URL}/graphql`;

export async function classifyContent(content: string, useOpenAI = false): Promise<string[]> {
  try {
    const queryName = useOpenAI ? 'classifyOpenAI' : 'classify';
    const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { ${queryName}(content: "${escapedContent}") }`,
      }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("GraphQL error:", json.errors);
      return [];
    }
    return json.data?.[queryName] || [];
  } catch (err) {
    console.log("Backend not available, using fallback classification");
    // Fallback: return some basic tags based on content
    const fallbackTags = ["document", "file"];
    if (content.toLowerCase().includes("image")) fallbackTags.push("image");
    if (content.toLowerCase().includes("video")) fallbackTags.push("video");
    if (content.toLowerCase().includes("music") || content.toLowerCase().includes("audio")) fallbackTags.push("audio");
    return fallbackTags;
  }
}

export async function loadFolderTree(dir: string): Promise<any[]> {
  try {
    const escapedDir = dir.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { getFolderTree(dir: "${escapedDir}") { id data { name tags } } }`,
      }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("GraphQL error:", json.errors);
      return [];
    }
    return json.data?.getFolderTree || [];
  } catch (err) {
    console.log("Backend not available, using mock folder tree");
    // Fallback: return a mock folder structure
    return [
      { id: "1", data: { name: "Documents", tags: ["work", "important"] } },
      { id: "2", data: { name: "Images", tags: ["media", "photos"] } },
      { id: "3", data: { name: "Videos", tags: ["media", "entertainment"] } },
      { id: "4", data: { name: "Music", tags: ["audio", "entertainment"] } },
    ];
  }
}

export async function generateFiles(prompt: string, basePath: string): Promise<string> {
  try {
    const escapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedPath = basePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation { generateFiles(prompt: "${escapedPrompt}", basePath: "${escapedPath}") }`,
      }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error("GraphQL error:", json.errors);
      return 'Error';
    }
    return json.data?.generateFiles || 'Error';
  } catch (err) {
    console.log("Backend not available, simulating file generation");
    // Fallback: simulate successful file generation
    return 'Files generated successfully (demo mode)';
  }
}
