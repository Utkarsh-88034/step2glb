const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const cors = require("cors");
const app = express();
const port = 2000;
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(express.urlencoded({ extended: true }));

app.post("/convert", upload.single("stepFile"), (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileData = Buffer.from(req.file.buffer, "base64"); // Assuming file data is base64 encoded

  // Temporary file path (just to provide a path for the opencascade-tools command)
  const tempFilePath = "temp_file.step"; // You can use any name here, it's not actually used

  // Write the file data to a temporary file
  fs.writeFile(tempFilePath, fileData, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res.status(500).json({ error: "File processing failed" });
    }

    exec(
      `opencascade-tools --format glb ${tempFilePath}`,
      (error, stdout, stderr) => {
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.error("Error deleting temporary file:", err);
          }
        });

        if (error) {
          console.error(`Conversion error: ${error.message}`);
          return res.status(500).json({ error: "Conversion failed" });
        }
        if (stderr) {
          console.error(`Conversion stderr: ${stderr}`);
        }
        console.log(`Conversion stdout: ${stdout}`);

        const convertedFile = fs.readFileSync(
          tempFilePath.split(".")[0] + ".glb"
        );
        res.set("Content-Type", "application/octet-stream");
        res.send(convertedFile);
        fs.unlink(tempFilePath.split(".")[0] + ".glb", (err) => {
          if (err) {
            console.error("Error deleting temporary GLB file:", err);
          }
        });
      }
    );
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
