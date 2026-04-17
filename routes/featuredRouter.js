import { Router } from "express";
import {
  getHomeFeatured,
  updateFeaturedSection,
} from "../controllers/featuredController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  attachPermissions,
  requirePermission,
} from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get("/home", getHomeFeatured);
router.put(
  "/:sectionId",
  authMiddleware,
  attachPermissions,
  requirePermission(PERMISSIONS.FEATURED_MANAGE),
  updateFeaturedSection
);

export default router;
