import asyncHandler from "../utils/async-handler.js";
import { apiError } from "../utils/api-error.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
       
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new apiError("Authentication token is missing", 401);
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        
        const user = await User.findById(decodedToken?._id || decodedToken?.id).select("-password -refreshToken -temporaryToken");

        if (!user) {
            throw new apiError("Invalid Access Token", 401);
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("JWT Verification Failed:", error.message);

        if (error instanceof apiError) {
            throw error;
        }

        throw new apiError(error?.message || "Invalid authentication token", 401);
    }
});