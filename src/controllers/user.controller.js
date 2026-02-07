import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
  
  // Step 1 - Get user details from Frontend
  // Step 2 - Validation of these details whether empty/format correct or not
  // Step 3 - Check if user already exists: username, emails etc (if it does no need to register)
  // Step 4 - Check for images like avatar (as required fields)
  // Step 5 - Upload them to cloudinary, check avatar here also (cuz what if user gave avatar or not, multer succesfully uploaded or not etc)
  // Step 6 - Create user Object - create their entry in db
  // Step 7 - Remove password and refresh token field from response
  // Step 8 - Check if user creation was successful or not
  // Step 9 - Return the response

  const {email, username, password, fullname} = req.body
  // console.log("email:", email);

  /* 
  if (!email?.trim === "") {throw new ApiError(400, "email is required")}
  if (!username?.trim === "") {throw new ApiError(400, "username is required")}
  if (!password?.trim === "") {throw new ApiError(400, "password is required")}
  if (!fullname?.trim === "") {throw new ApiError(400, "fullname is required")}
  OR better way below
  */

  if ([email, username, password, fullname].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or:[{ username }, { email }]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) {
    throw new ApiError (500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

export { registerUser }