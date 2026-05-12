// Backend pentru Proiectul nr. 4 - Sortare Nume

require("dotenv").config();

// Aici am importat modulele necesare: express, cors, joi
const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");

// Aici am initializat aplicatia Express
const app = express();

// Aici am activat CORS si parsarea JSON, pentru comunicarea cu frontend-ul React
app.use(cors());
app.use(express.json());

// Aici am definit o rută statică pentru fișierele de ieșire generate
const OUTPUT_DIR = path.join(__dirname, "output");

// Aici am creat directorul /output dacă nu există deja
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

app.use("/output", express.static(OUTPUT_DIR));

// Aici am creat schema Joi pentru validarea cererii, unde names este un array de string-uri cu minim 2 caractere.
const namesSchema = Joi.object({
  names: Joi.array()
    .items(Joi.string().trim().min(2).required())
    .min(1)
    .required(),
});

// Aici am creat ruta de test
app.get("/", (req, res) => {
  res.json({
    message: "Sortare Nume API functioneaza...",
    endpoints: {
      sort: "POST /api/names/sort",
      output: "GET /output/<filename>",
    },
  });
});

// Am definit ruta POST /api/names/sort
// Primește { names: [...] }, sortează alfabetic și scrie în fișier.
// Returnează { sorted, fileUrl, fileName, count }.
app.post("/api/names/sort", (req, res) => {
  // Aici am validat datele cu Joi
  const { error } = namesSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const { names } = req.body;

    // Aici am sortat alfabetic folosind Array.prototype.sort() și
    // localeCompare pentru a gestiona corect diacriticele și caracterele speciale
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "ro"));

    // Aici am construit conținutul fișierului, respectând formatul din enunț cu lista de nume
    const header = `Lista contine ${sorted.length} nume`;
    // Aici am adăugat linia de separare, repetând "- " de același număr de ori ca lungimea header-ului
    const separator = "- ".repeat(Math.ceil(header.length / 2)).trim();

    const content = [header, separator, ...sorted].join("\n");

    // Aici am scris fișierul cu un nume unic bazat pe timestamp
    // pentru a evita conflicte între cereri simultane
    const timestamp = Date.now();
    const fileName = `nume_sortate_${timestamp}.txt`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Fișier generat: ${fileName} (${sorted.length} nume)`);

    res.status(200).json({
      sorted,
      fileUrl: `/output/${fileName}`,
      fileName,
      count: sorted.length,
    });
  } catch (err) {
    console.error("Eroare la sortare:", err.message);
    res.status(500).json({ error: "Nu s-a putut genera fișierul." });
  }
});

// Aici pornim serverul
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serverul ruleaza la http://localhost:${PORT}`);
  console.log(`Fișiere generate în: ${OUTPUT_DIR}`);
});
