export async function classifyContent(content: string): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            classify(content: "${content}")
          }
        `,
      }),
    });

    const json = await response.json();
    return json.data.classify || [];
  } catch (err) {
    console.error("Błąd klasyfikacji:", err);
    return [];
  }
}
