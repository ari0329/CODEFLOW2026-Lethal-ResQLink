const express = require("express");
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "Analytics route active" });
});

module.exports = router;
