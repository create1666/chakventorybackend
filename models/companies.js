import mongoose from "mongoose";

const companySchema = mongoose.Schema({
  name: String,
  imgUrl: String,
  description: String,
});

export default mongoose.model("company", companySchema);
