import express from "express";
const router = express.Router();

router.post("/", async (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Invalid content" });
  }

  // Prosty mock – tu możesz podpiąć AI
  const lower = content.toLowerCase();
  let result = "inne";

  if (lower.includes("faktura")) result = "finanse";
  else if (lower.includes("zdjęcie") || lower.includes("photo")) result = "obrazy";
  else if (lower.includes("dokument")) result = "dokumenty";

  return res.json({ result });
});

export default router;
