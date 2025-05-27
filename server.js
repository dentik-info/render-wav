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
  console.log("POST /upload aufgerufen");
  if (!req.file) {
    console.log("Keine Datei empfangen oder falsches Format.");
    return res.status(400).send("Keine Datei hochgeladen oder falsches Format.");
  }
  const filePath = req.file.path;
  const outputFilePath = `uploads/${req.file.filename}.mp3`;
  console.log(`Datei empfangen: ${req.file.originalname}, gespeichert unter: ${filePath}`);

  ffmpeg(filePath)
    .inputFormat("wav") // explizit WAV als Eingabe
    .toFormat("mp3")
    .on("start", (cmd) => {
      console.log("Starte ffmpeg mit Befehl:", cmd);
    })
    .on("progress", (progress) => {
      console.log(`Konvertierungsfortschritt: ${progress.percent ? progress.percent.toFixed(2) : '?'}%`);
    })
    .on("end", () => {
      console.log(`Konvertierung abgeschlossen: ${outputFilePath}`);
      res.download(outputFilePath, "converted.mp3", (err) => {
        if (err) {
          console.error("Fehler beim Download:", err);
        } else {
          console.log("Download erfolgreich ausgeliefert.");
        }
        fs.unlink(filePath, (err) => {
          if (err) console.error("Fehler beim Löschen der Ursprungsdatei:", err);
          else console.log("Ursprungsdatei gelöscht:", filePath);
        });
        fs.unlink(outputFilePath, (err) => {
          if (err) console.error("Fehler beim Löschen der MP3-Datei:", err);
          else console.log("MP3-Datei gelöscht:", outputFilePath);
        });
      });
    })
    .on("error", (err) => {
      console.error("Fehler bei der Konvertierung:", err);
      res.status(500).send("Conversion failed");
      fs.unlink(filePath, (err) => {
        if (err) console.error("Fehler beim Löschen der Ursprungsdatei nach Fehler:", err);
        else console.log("Ursprungsdatei nach Fehler gelöscht:", filePath);
      });
    })
    .save(outputFilePath);
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

console.log("Server started")
