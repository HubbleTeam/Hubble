const sharp = require('sharp');
const fs = require('fs');

// Chemin vers le dossier contenant les images à convertir
const folderPath = "public/img";

// Parcourir tous les fichiers dans le dossier
fs.readdir(folderPath, function(err, files) {
  if (err) {
    console.error("Erreur de lecture du dossier : ", err);
    return;
  }

  files.forEach(function(file) {
    // Vérifier si le fichier est une image
    if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
      const filePath = folderPath + "/" + file;
      const outputFilePath = folderPath + "/" + file.replace(/\.[^/.]+$/, "") + ".webp";

      // Convertir l'image en format WebP
      sharp(filePath)
        .webp({ quality: 80 })
        .toFile(outputFilePath, function(err) {
          if (err) {
            console.error("Erreur de conversion : ", err);
            return;
          }

          console.log(`L'image ${file} a été convertie en format WebP.`);
        });
    }
  });
});
