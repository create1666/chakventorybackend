import mongoose from "mongoose";

const companySchema = mongoose.Schema({
  name: String,
  imgUrl: String,
});

export default mongoose.model("companyCollection", companySchema);
