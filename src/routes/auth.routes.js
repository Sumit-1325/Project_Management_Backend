import { Router } from "express";
import { registerUser ,loginUser } from "../controllers/auth.controllers.js";
import { userRegistrationValidators , userLoginValidators } from "../validators/index.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";



const router = Router();

router.route("/register").post(userRegistrationValidators() //running the method then collect the errors if any in the express-validator and extracted by validator middleware 
, validatorMiddleware, registerUser);

router.route("/login").post(userLoginValidators(), validatorMiddleware, loginUser);

export default router;