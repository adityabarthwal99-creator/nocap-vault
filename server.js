const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dnt1xm39h',
  api_key: '897376296128194',
  api_secret: '-_lqTSMtsGGY9r2DOPJa0KVxhiM'
});

const app = express();
app.use(express.static('public'));
app.use(express.json());

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const clientName = req.body.name || 'unknown';
    const isLogo = file.fieldname === 'logo';
    return {
      folder: `nocap-vault/${clientName}/${isLogo ? 'Logo' : 'LUTS'}`,
      resource_type: 'raw',
      public_id: file.originalname.replace(/\.[^/.]+$/, ''),
      format: file.originalname.split('.').pop(),
      overwrite: true
    };
  }
});

const upload = multer({ storage });

app.post('/upload', (req, res) => {
  upload.fields([{ name: 'logo' }, { name: 'luts' }])(req, res, async (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    if (!req.body.name) return res.status(400).json({ ok: false, error: 'Client name missing' });
    res.json({ ok: true });
  });
});

app.get('/data', async (req, res) => {
  try {
    const result = await cloudinary.api.sub_folders('nocap-vault');
    const clients = await Promise.all(
      result.folders.map(async (folder) => {
        const clientName = folder.name;
        let logo = '';
        try {
          const logoRes = await cloudinary.api.resources({ type: 'upload', prefix: `nocap-vault/${clientName}/Logo`, resource_type: 'image', max_results: 1 });
          if (logoRes.resources.length) logo = logoRes.resources[0].secure_url;
        } catch (e) {}
        let luts = [];
        try {
          const lutsRes = await cloudinary.api.resources({ type: 'upload', prefix: `nocap-vault/${clientName}/LUTS`, resource_type: 'raw', max_results: 50 });
          luts = lutsRes.resources.map(r => ({ name: r.public_id.split('/').pop() + '.' + r.format, url: r.secure_url }));
        } catch (e) {}
        return { name: clientName, logo, luts };
      })
    );
    res.json(clients);
  } catch (e) { res.json([]); }
});

app.delete('/client/:n', async (req, res) => {
  try { await cloudinary.api.delete_folder(`nocap-vault/${req.params.n}`); } catch (e) {}
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ NOCAP VAULT RUNNING → http://localhost:${PORT}`));
