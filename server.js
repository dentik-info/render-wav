const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Nur WAV-Dateien erlauben
    if (file.mimetype === "audio/wav" || file.originalname.match(/\.wav$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Nur WAV-Dateien sind erlaubt!"), false);
    }
  },
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Keine Datei hochgeladen oder falsches Format.");
  }
  const filePath = req.file.path;
  const outputFilePath = `uploads/${req.file.filename}.mp3`;

  ffmpeg(filePath)
    .inputFormat("wav") // explizit WAV als Eingabe
    .toFormat("mp3")
    .on("end", () => {
      res.download(outputFilePath, "converted.mp3", (err) => {
        if (err) {
          console.error("Error during download:", err);
        }
        fs.unlink(filePath, () => { });
        fs.unlink(outputFilePath, () => { });
      });
    })
    .on("error", (err) => {
      console.error("Error during conversion:", err);
      res.status(500).send("Conversion failed");
      fs.unlink(filePath, () => { });
    })
    .save(outputFilePath);
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

console.log("Server started")
