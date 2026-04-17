import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  reorderCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { attachPermissions, requirePermission } from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/", getCategories);
router.post(
  "/",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.CATEGORY_MANAGE),
  createCategory
);
router.put(
  "/reorder",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.CATEGORY_MANAGE),
  reorderCategories
);
router.put(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.CATEGORY_MANAGE),
  updateCategory
);
router.delete(
  "/:id",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.CATEGORY_MANAGE),
  deleteCategory
);

export default router;
