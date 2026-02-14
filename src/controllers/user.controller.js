import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

// Some methods to make for convenience

const generateAccessAndRefreshToken = async(userId) =>
{
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(404, "User not found")
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

// Real work starts here

// 1) Register User function
const registerUser = asyncHandler( async (req, res) => {
  
  // Step 1 - Get user details from Frontend
  // Step 2 - Validation of these details whether empty/format correct or not
  // Step 3 - Check if user already exists: username, emails etc (if it does no need to register, redirect to login page instead)
  // Step 4 - Check for images like avatar (as required fields)
  // Step 5 - Upload them to cloudinary, check avatar here also (cuz what if user gave avatar or not, multer succesfully uploaded or not etc)
  // Step 6 - Create user Object - create their entry in db
  // Step 7 - Remove password and refresh token field from response
  // Step 8 - Check if user creation was successful or not
  // Step 9 - Return the response

  // Step 1
  const {email, username, password, fullname} = req.body
  // console.log("email:", email);

  /* 
  if (!email?.trim === "") {throw new ApiError(400, "email is required")}
  if (!username?.trim === "") {throw new ApiError(400, "username is required")}
  if (!password?.trim === "") {throw new ApiError(400, "password is required")}
  if (!fullname?.trim === "") {throw new ApiError(400, "fullname is required")}
  OR better way below
  */

  // Step 2
  if ([email, username, password, fullname].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3
  const existedUser = await User.findOne({
    $or:[{ username }, { email }]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  // Step 4
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Step 5
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required");
  }

  // Step 6
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  // Step 7
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // Step 8
  if(!createdUser) {
    throw new ApiError (500, "Something went wrong while registering the user")
  }

  // Step 9
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

// 2) Login User function
const loginUser  = asyncHandler( async (req, res) => {
  
  // Step 1 - Get your data from the req body
  // Step 2 - On the basis of username or email get your user
  // Step 3 - Find the user exists or not
  // Step 4 - Password matching now
  // Step 5 - If incorrect say so, if correct generate the access and refresh tokens
  // Step 6 - Send cookies and stuff
  // Step 7 - Return the response

  // Step 1
  const { email, username, password} = req.body

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required")
  }

  // Step 2
  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  // Step 3
  if (!user){
    throw new ApiError(404, "User does not exist")
  }

  // Step 4
  const isPasswordValid = await user.isPasswordCorrect(password)
  // Make sure the "user" variable is the one registered in your database not the "User" from MongoDB database

  // Step 5
  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid User credentials")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  // Step 6
  const options = {
    httpOnly: true,
    secure: true
  }

  // Step 7
  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged In Successfully"
    )
  )
})

// 3) Logout User function
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate( 
    req.user._id,
    {
      $set: {
      refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
    const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

// 4) Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

 if (!incomingRefreshToken) {
  throw new ApiError(401, "Unauthorized request")
 }

  try {
    const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if (incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newrefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

// 5) Change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect){
    throw new ApiError(400, "Invalid old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// 6) Change Account details
const getCurrentUser = asyncHandler ( async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler ( async(req, res) => {
  const {fullname, email} = req.body

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email
      }
    },
    {new: true}
  
  ).select("-passoword")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))

})

// 7) Update Avatar and Cover Image
const updateUserAvatar = asyncHandler (async (req, res) => {
  const avatarLocalPath = req.file?.path
  
  if (!avatarLocalPath) {
    throw new ApiError (400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) {
    throw new ApiError (400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,

    {
      $set:{
        avatar: avatar.url
      }
    },

    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover Image was updated successfully")
  )

})

const updateUserCoverImage = asyncHandler (async (req, res) => {
  const coverImageLocalPath = req.file?.path
  
  if (!coverLocalPath) {
    throw new ApiError (400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url) {
    throw new ApiError (400, "Error while uploading on cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,

    {
      $set:{
        avatar: coverImage.url
      }
    },

    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Avatar Image was updated successfully")
  )

})

// 8) Channel Profile Details
const getUserChannelProfile = asyncHandler (async (req, res) => {
  
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
        $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubcribedToCount: {
          $size: "subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        email: 1,
        username: 1,
        fullname: 1,
        subscribersCount: 1,
        channelsSubcribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User Channel fetched successfully")
  )

})

export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
 }