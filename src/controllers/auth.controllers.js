import { User } from "../models/user.models.js";
import {apiResponse} from "../utils/api-response.js";
import {apiError} from "../utils/api-error.js";
import asyncHandler  from "../utils/async-handler.js";
import {sendEmail , mailGeneratorVerification} from "../utils/mail.js"


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError("User not found", 404);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in token generation:", error);
    throw new apiError("Token generation failed", 500);
  }
};


export const registerUser = asyncHandler(async (req, res, next) => {
  const { userName, email, password } = req.body;

  const existngUser = await User.findOne({ $or: [{ email }, { userName }] });

  if (existngUser) {
    return next(
      new apiError("User with given email or username already exists", 409, []),
    );
  }

  const user = await User.create({
    userName,
    email,
    password,
    isEmailVerified: false,
  });

  const {unHashedToken, hashedToken, expireryTime } = user.generateTemporaryToken();
  user.temporaryToken = hashedToken;
  user.temporaryTokenExpireAt = expireryTime;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification - Proj Management",
    mailgenContent: mailGeneratorVerification( user.userName , `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}` ),

  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken  -emailVerificationToken -emailVerificationTokenExpiry",
  );

  if (!createdUser) {
    return next(new apiError("User creation failed", 500));
  }

  return res
  .status(201)
  .json(
     new apiResponse(201, {data: createdUser},"User registered successfully. Please verify your email."  ),
  );

});


export const loginUser = asyncHandler(async (req, res, next) => {
  console.log("Login request body:", req.body);
  const { userName, password } = req.body;
  if (!userName ) {
    return next(new apiError("Username is required", 400, []));
  }
  if (!password) {
    return next(new apiError("Password is required", 400, []));
  }
  const user  = await User.findOne({ userName });

  if (!user) {
    return next(new apiError("Invalid username or password", 401, []));
  }

  if (!user.isEmainlVerified) {
    return next(new apiError("Please verify your email before logging in", 403, []));
  }
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new apiError("Invalid username or password", 401, []));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken  -emailVerificationToken -emailVerificationTokenExpiry",
  );

  if (!loggedInUser) {
    return next(new apiError("User login failed", 500));
  }
  
  const cookieOptions = {
    httpOnly: true, //browser JS can't access cookie read and write is not allowed console.log(document.cookie) will not show cookies
    secure : true,
  };

  

  return res
  .status(200)
  .cookie("refreshToken", refreshToken, cookieOptions)
  .cookie("accessToken",accessToken , cookieOptions)
  .json(
     new apiResponse(200, {data: loggedInUser, accessToken},"User logged in successfully"  ),
  );

});