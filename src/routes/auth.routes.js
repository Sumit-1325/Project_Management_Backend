import { Router } from "express";
import { registerUser ,loginUser, logoutUser } from "../controllers/auth.controllers.js";
import { userRegistrationValidators , userLoginValidators } from "../validators/index.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(userRegistrationValidators() //running the method then collect the errors if any in the express-validator and extracted by validator middleware 
, validatorMiddleware, registerUser);

router.route("/login").post(userLoginValidators(), validatorMiddleware, loginUser);

//secured route
router.route("/logout").post(verifyJwt, logoutUser);

export default router;