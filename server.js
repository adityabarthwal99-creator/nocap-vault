const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use('/clients', express.static('clients'));
app.use(express.json());

// FIX: pehle name lo, phir folder banao
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const clientName = req.body.name || 'unknown';
      const subFolder = file.fieldname === 'logo' ? 'Logo' : 'LUTS';
      const dir = path.join('clients', clientName, subFolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, file.originalname)
  })
});

// Upload route
app.post('/upload', (req, res) => {
  upload.fields([{ name: 'logo' }, { name: 'luts' }])(req, res, (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    if (!req.body.name) return res.status(400).json({ ok: false, error: 'Client name missing' });
    res.json({ ok: true });
  });
});

// Scan clients folder
function scan() {
  if (!fs.existsSync('clients')) return [];
  return fs.readdirSync('clients')
    .filter(n => fs.statSync(`clients/${n}`).isDirectory())
    .map(n => {
      const logoDir = `clients/${n}/Logo`;
      const lutsDir = `clients/${n}/LUTS`;
      const logoFiles = fs.existsSync(logoDir) ? fs.readdirSync(logoDir) : [];
      const lutFiles = fs.existsSync(lutsDir) ? fs.readdirSync(lutsDir) : [];
      return {
        name: n,
        logo: logoFiles.length ? `/clients/${n}/Logo/${logoFiles[0]}` : '',
        luts: lutFiles.map(x => ({ name: x, url: `/clients/${n}/LUTS/${x}` }))
      };
    });
}

app.get('/data', (req, res) => res.json(scan()));

app.delete('/client/:n', (req, res) => {
  const dir = 'clients/' + req.params.n;
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  res.json({ ok: true });
});

app.listen(3000, () => console.log('✅ NOCAP VAULT RUNNING → http://localhost:3000'));
