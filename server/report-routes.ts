import { Router } from "express";

export const reportRoutes = Router();

reportRoutes.get("/", async (req, res) => {
  res.json({ message: "Relatórios funcionando!" });
});
