import express from "express";
import cors from "cors";
import index from "./routes/index.js";
import companyRoute from "./routes/companyRoute.js";
import "dotenv/config";
import mongoose from "mongoose";

//App config
const app = express();
const port = process.env.PORT || 4000;
const connection_url = `mongodb+srv://${process.env.API_USERNAME}:${process.env.API_PRIVATE_KEY}@cluster0.mwvoa.mongodb.net/chakventory?retryWrites=true&w=majority`;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

//middlewares
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(index);
app.use("/chakventory", companyRoute);

//DB config
mongoose.connect(connection_url, options);
const db = mongoose.connection;
db.once("open", function () {
  console.log("Connected successfully");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
