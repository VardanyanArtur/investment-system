import { Request, Response } from "express";
import { VipPlan } from "../models/VipPlan";

// CREATE
export const createVipPlan = async (req: Request, res: Response) => {
  try {
    const plan = await VipPlan.create(req.body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: "Ошибка создания", error: err });
  }
};

// GET ALL
export const getVipPlans = async (_: Request, res: Response) => {
  try {
    const plans = await VipPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Ошибка получения", error: err });
  }
};

// GET ONE
export const getVipPlan = async (req: Request, res: Response) => {
  try {
    const plan = await VipPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Не найдено" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: "Ошибка", error: err });
  }
};

// UPDATE
export const updateVipPlan = async (req: Request, res: Response) => {
  try {
    const plan = await VipPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!plan) return res.status(404).json({ message: "Не найдено" });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: "Ошибка обновления", error: err });
  }
};

// DELETE
export const deleteVipPlan = async (req: Request, res: Response) => {
  try {
    const plan = await VipPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Не найдено" });
    res.json({ message: "Удалено" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка удаления", error: err });
  }
};
