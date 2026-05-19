import { RequestHandler } from "express";

export const listParties: RequestHandler = async (_req, res) => {
  res.json({ parties: [] });
};

