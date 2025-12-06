import asyncHandler from "../utils/async-handler";
import { apiError } from "../utils/api-error.js";
import {User} from "../models/user.models.js";
import jwt from "jsonwebtoken";


export const verifyJwt = asyncHandler(async (req , res, next) => {
    const token = (req.cookies?.accessToken || req.header?("Authorization")?.replace("Bearer ", ""): null)

    if(!token){
        return (new apiError("Authentication token is missing" , 401));
    }

    try {
        const decodedToken = jwt.verify(token , process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decodedToken.id).select("-password -refreshToken -temporaryToken");

        if(!user){
            return next(new apiError("User associated with this token no longer exists" , 401));
        }
        req.user = user;
        next();
        
    } catch (error) {
        throw new apiError("Invalid or expired authentication token" , 401);
    }



});
