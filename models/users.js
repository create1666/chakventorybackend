import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  username: String,
  phone: String,
  password: String,
  company: {
    type: mongoose.Types.ObjectId,
    ref: "company",
  },
  otp: String,
  // mine: Boolean,
  otpExpiresAt: Date,
});

export default mongoose.model("user", UserSchema);
