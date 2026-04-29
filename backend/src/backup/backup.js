const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../banco_loja.db");
const backupDir = path.join(__dirname, "./files");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

function fazerBackup() {
  const data = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `backup-${data}.db`);

  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      console.error("❌ ERRO no backup:", err);
      return;
    }

    fs.stat(backupPath, (err, stats) => {
      if (err) {
        console.error("❌ Backup criado mas não pode ser verificado:", err);
        return;
      }

      if (stats.size > 0) {
        console.log(` Backup OK (${(stats.size / 1024).toFixed(2)} KB):`, backupPath);
        const arquivos = fs.readdirSync(backupDir)
          .filter(f => f.endsWith(".db"))
          .map(f => ({
            nome: f,
            tempo: fs.statSync(path.join(backupDir, f)).mtime.getTime()
          }))
          .sort((a, b) => b.tempo - a.tempo);

        // mantém só os 5 mais recentes
        if (arquivos.length > 5) {
          const antigos = arquivos.slice(5);

          antigos.forEach(file => {
            const caminho = path.join(backupDir, file.nome);
            fs.unlinkSync(caminho);
            console.log(" Backup antigo removido:", file.nome);
          });
        }
      } else {
        console.error("Backup criado, mas está vazio!");
      }
    });
  });
}

// ao iniciar
fazerBackup();

// a cada 1 hora
setInterval(fazerBackup, 3600000);