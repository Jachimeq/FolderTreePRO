export async function classifyContent(content: string): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:3000/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await response.json();
    const raw = data.result;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return [raw];
    return ["brak"];
  } catch (err) {
    console.error("❌ classifyContent error:", err);
    return ["błąd"];
  }
}
  