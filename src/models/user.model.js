import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"  // for creating auth tokens
import bcrypt from "bcrypt"   // for hashing the passwords

const userSchema = new Schema (
    {
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true   // for optimising searching of username but use it rarely
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
      },

      avatar: {
        type: String, // we will use a url of avatar/images throughout that's why string
        required: true,
      },

      coverImage: {
        type: String
      },

      watchHistory:[
          {   // Simple types (String, Number) are JavaScript built-ins; Schema.Types (ObjectId, Mixed, Decimal128) are MongoDB's special types requiring full path.
          type: Schema.Types.ObjectId,  // This creates a reference to Video model (this creates relation between collections)
          ref: "Video"  // You need to give a ref in the fields like what model are you reffering 
        }
      ],

      password: {
        type: String,
        required: [true, 'Password is required'],
      },

      refreshToken: {
        type: String
      }
  },
  {
    timestamps: true  // Auto adds createdAt and updatedAt fields
  }
)

userSchema.pre("save", async function () {  // .pre("save") - this part of code runs before saving data (password here) to the DB
  if (!this.isModified("password")) return;  // (isModified) - checks if the password filed is changed, skips if not modified
  this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function 
(password){
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema);

/* Common Field Options:
Keyword |	Purpose	| Example
type |	Data type |	String, Number, Boolean, Date
required |	Must provide value |	required: true or required: [true, "Email needed"]
unique |	No duplicates	| unique: true
default |	Default value |	default: 0 or default: Date.now
trim |	Remove whitespace |	trim: true
lowercase |	Convert to lowercase |	lowercase: true
uppercase	| Convert to uppercase	| uppercase: true
index	| Create database | index	index: true
ref |	Reference another model |	ref: "User"
enum |	Allowed values only |	enum: ["male", "female", "other"]
min/max	| For numbers/dates |	min: 0, max: 100
minLength/maxLength	| For strings |	minLength: 8
 */