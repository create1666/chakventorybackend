import express from "express";
import dayjs from "dayjs";
import companySchema from "../models/companies.js";
import UserModel from "../models/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import "dotenv/config";

// const bcrypt = require("bcrypt");

const router = express.Router();

import client from "twilio";
const clientOpt = client(process.env.Account_SID, process.env.AUTH_TOKEN);

// -> register ROUTE
router.post("/register", async (req, res) => {
  const userDetails = req.body;
  const { username, password: plainTextPassword, phone } = userDetails;

  if (
    (!username && typeof username !== "string") ||
    (!plainTextPassword && typeof plainTextPassword !== "string") ||
    !phone
  ) {
    return res.json({ status: "error", message: "Invalid credentials" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
  console.log(hashedPassword);
  try {
    const user = await UserModel.create({
      username,
      password: hashedPassword,
      phone,
    });
    if (user) {
      await user.save();
      return res.json({
        status: "ok",
        message: "User created successfully",
        user,
      });
    }

    console.log(user);
  } catch (error) {
    // -> errorcode: 11000 -> duplicate keys
    if (error.code === 11000) {
      return res.json({
        status: "error",
        error: "User already exist",
      });
    }
    throw error;
  }
  return res.json({ status: "ok" });
});

// -> store Route creation
router.post("/company", (req, res) => {
  const companyDetails = req.body;
  companySchema.create(companyDetails, (err, data) => {
    try {
      if (!err) res.status(201).send(data);
    } catch (err) {
      res.status(500).send(err);
    }
  });
});

// -> store Search Route
router.get("/companies", async (req, res) => {
  const { search } = req.query;

  const conditions = {};
  // regex loop search to query the mongodb if searched variable exist
  if (search) {
    conditions.name = new RegExp(search, "i");
  }

  console.log(conditions, "cond");
  // {
  //   search: "classic";
  // }

  try {
    const companies = await companySchema.find(conditions);
    res.status(200).send(companies);
  } catch (err) {
    res.status(500).send(err);
  }
});

const sendOtpSms = (oneTimeOtp) => {
  clientOpt.messages
    .create({
      body: `Your Chakventory verification code is: ${oneTimeOtp}`,
      from: process.env.TWILO_FROM,
      to: process.env.TWILO_TO,
    })
    .then((error) => console.log("TWILLO", error));
};
// -> Login Route
router.get("/login", async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.json({ message: "Invalid credentials" });
  }
  try {
    const user = await UserModel.findOne({ phone }); //
    const { password: hashedPassword } = user;
    if (!user)
      return res.json(404).json({
        status: "error",
        error: "User not found",
      });

    console.log(user);

    if (await bcrypt.compare(password, hashedPassword)) {
      let generatedOTP = otpGenerator.generate(6, {
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });
      user.otp = generatedOTP;
      // otp to expire every 10 minutes count...
      user.otpExpiresAt = dayjs().add(10, "min");
      await user.save();
      console.log("userDb", user);

      //TODO: send sms otp to the user via twilo service
      sendOtpSms(user.otp);
      res.json({ status: "ok", userId: user._id });
    } else {
      res.json({
        status: "error",
        error: "Incorrect phone number or password",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if user exist -> this is needed to query the instances/rest of the user object details eg otp, expirydate etc

    if (!user.otp) return res.json({ message: "Request for OTP" });

    // check if otp from the request body matches stored otp in the database
    if (user.otp !== otp)
      return res.status(400).json({ message: "OTP incorrect" });

    // check if otp has expired -> bad at dates? -> Dayjs makes it easy...
    if (dayjs().isAfter(dayjs(otp.otpExpiresAt))) {
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: "OTP already expired" });
    }

    // to expose userID that could or would be needed for futher database query in the future ...
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET
    );
    //  reset otp and expiry date to null/empty once logged even if otp hasn't expired...
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ status: "ok", data: token });
  } catch (e) {
    res.status(500).json({ message: "Error occured, we are working on it" });
  }
});

// -> change-password Route
router.post("/forgot-password", async (req, res) => {
  const { token, newpassword } = req.body;
  if (!newpassword && typeof newpassword !== "string") {
    return res.json({ status: "error", error: "Inlvalid credentials" });
  }

  if (newpassword < 5) {
    return res.json({
      status: "error",
      error: "New password too small. Should be atleast 6 characters long.",
    });
  }
  try {
    const user = await jwt.verify(token, process.env.JWT_SECRET);
    const _id = user._id;
    const hashedNewpassword = await bcrypt.hash(newpassword, 10);
    await UserModel.updateOne(
      { _id },
      {
        $set: hashedNewpassword,
      }
    );
  } catch (error) {
    res.json({ status: "error" });
  }
});

export default router;
