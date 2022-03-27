import express from "express";
import companySchema from "../models/companies";

const router = express.Router();

router.post("/chakventory/companies", (req, res) => {
  const companyDetails = req.body;
  companySchema.create(companyDetails, (err, data) => {
    try {
      if (!err) res.status(201).send(data);
    } catch (err) {
      res.status(500).send(err);
    }
  });
});

router.get("/chakventory/companiesInfo", (req, res) => {
  companySchema.find((err, data) => {
    try {
      if (!err) res.status(200).send(data);
    } catch (err) {
      res.status(500).send(err);
    }
  });
});

module.exports = router;
