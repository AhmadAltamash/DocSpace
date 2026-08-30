import path from 'path';
import fs from 'fs/promises';
import store from '../repository/index.js';
import { textToDoc, htmlToDoc } from '../utils/editor.js';
import mammoth from 'mammoth';

const ALLOWED_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.docx',
]);

// POST /api/files/import
// multipart/form-data, field name "file"
export async function importFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded (expected form field "file")',
    });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    await fs.unlink(req.file.path).catch(() => {});

    return res.status(400).json({
      error: `Unsupported file type "${ext}". Supported types: .txt, .md, .docx`,
    });
  }

  try {
    let content;

    if (ext === '.docx') {
      // DOCX → HTML → Tiptap JSON
      const result = await mammoth.convertToHtml({
        path: req.file.path,
      });

      content = htmlToDoc(result.value);
    } else {
      // TXT / MD → Tiptap JSON
      const raw = await fs.readFile(req.file.path, 'utf-8');

      content = textToDoc(raw);
    }

    const title =
      path.basename(req.file.originalname, ext).trim() ||
      'Imported document';

    const doc = await store.documents.create({
      title,
      content,
      owner: req.user.id,
    });

    res.status(201).json({
      document: doc,
    });
  } catch (error) {
    console.error('File import error:', error);

    res.status(500).json({
      error: 'Could not import the uploaded file',
    });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
}