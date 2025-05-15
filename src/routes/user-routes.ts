import { Router } from "express";
import { UserController } from "../controllers/user-controllers";
import {
  userValidation,
  asyncHandler,
  rateLimiter,
} from "../middlewares";

const router = Router();
const userController = new UserController();

const createAccountRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many accounts created from this IP",
});

const queryRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: "Too many queries",
});

router.post(
  "/users",
  createAccountRateLimiter,
  userValidation.create,
  asyncHandler(userController.createUser)
);

router.get(
  "/users/search",
  queryRateLimiter,
  userValidation.queryByEmail,
  asyncHandler(userController.getUserByEmail)
);

router.get(
  "/users",
  asyncHandler(userController.getAllUsers)
);

router.get(
  "/users/:id",
  userValidation.id,
  asyncHandler(userController.getUserById)
);

router.get(
  "/users/:userId/films",
  asyncHandler(userController.getUserPurchasedFilms)
);

router.get(
  "/users/:userId/films/:filmId/check",
  asyncHandler(userController.checkFilmPurchased)
);

router.get(
  "/users/:userId/stats",
  asyncHandler(userController.getUserStats)
);

router.get(
  "/users/:userId/purchase-history",
  asyncHandler(userController.getUserPurchaseHistory)
);

router.put(
  "/users/:id",
  userValidation.id,
  userValidation.update,
  asyncHandler(userController.updateUser)
);

router.delete(
  "/users/:id",
  userValidation.id,
  asyncHandler(userController.deleteUser)
);

export default router;
