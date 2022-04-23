import mongoose from "mongoose";

const compSchema = mongoose.Schema({
  name: String,
  subdomain: String,
});

export default mongoose.model("owner", compSchema);
