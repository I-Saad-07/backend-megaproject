import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
  
  subscriber: {
    type: Schema.Types.ObjectId,  // The User who is subscribing
    ref: "User"
  },

  channel: {
    type: Schema.Types.ObjectId,  // The channel who is being subscribed
    ref: "User"
  }
  }, {timestamps: true}
)


export const Subscription = mongoose.model("Subscription", subscriptionSchema)