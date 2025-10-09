// api/upload.js
// - verifies x-admin-token header
// - parses multipart form data (pdf file + title + author)
// - commits PDF file to repo at pdfs/<safe-filename>.pdf
// - fetches books.json, inserts new entry, and updates books.json

import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

async function verifyToken(token) {
  if (!token) return false;
  try {
    const [b64, sig] = token.split('.');
    const payload = Buffer.from(b64, 'base64').toString('utf8');
    const crypto = await import('crypto');
    const secret = process.env.ADMIN_SECRET || 'very-secret-change-me';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expected !== sig) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// ✅ Fixed version: allow Khmer + English filenames safely
function safeFileName(title) {
  return title
    .replace(/[^\u1780-\u17FFa-zA-Z0-9\-_.]/g, '-') // keep Khmer + English
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function parseForm(req) {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function githubRequest(path, method = 'GET', body = null, token = null) {
  const base = 'https://api.github.com';
  const headers = {
    'User-Agent': 'ebook-site-admin',
    'Accept': 'application/vnd.github+json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
  return { ok: res.ok, status: res.status, data: json };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' });

  const tokenHeader = req.headers['x-admin-token'] || '';
  const ok = await verifyToken(tokenHeader);
  if (!ok) return res.status(401).send({ error: 'Invalid admin token' });

  try {
    const { fields, files } = await parseForm(req);
    const title = (fields.title || '').trim();
    const author = (fields.author || '').trim() || 'Unknown';
    if (!title) return res.status(400).send({ error: 'Missing title' });
    if (!files.pdf) return res.status(400).send({ error: 'Missing pdf file' });

    const pdf = files.pdf;
    const raw = await fs.promises.readFile(pdf.filepath);
    const base64 = raw.toString('base64');

    // --- repo setup ---
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.REPO_OWNER;
    const REPO = process.env.REPO_NAME;
    const BRANCH = process.env.REPO_BRANCH || 'main';
    if (!GITHUB_TOKEN || !OWNER || !REPO)
      return res.status(500).send({ error: 'Server misconfigured (missing GITHUB_TOKEN / REPO_OWNER / REPO_NAME)' });

    // --- filenames ---
    const safe = safeFileName(title) || `book-${Date.now()}`;
    const pdfPath = `pdfs/${safe}.pdf`;

    // --- 1. Upload the PDF to GitHub ---
    const createPath = `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(pdfPath)}`;
    const createBody = {
      message: `Add book PDF: ${title}`,
      content: base64,
      branch: BRANCH
    };
    const uploadRes = await githubRequest(createPath, 'PUT', createBody, GITHUB_TOKEN);
    if (!uploadRes.ok) return res.status(uploadRes.status).send({ error: uploadRes.data.message || 'Failed to upload PDF' });

    // --- 2. Update books.json ---
    const booksPath = `/repos/${OWNER}/${REPO}/contents/books.json?ref=${BRANCH}`;
    const currentBooks = await githubRequest(booksPath, 'GET', null, GITHUB_TOKEN);
    if (!currentBooks.ok) return res.status(500).send({ error: 'Failed to fetch books.json' });

    const decoded = Buffer.from(currentBooks.data.content, 'base64').toString('utf8');
    let books = [];
    try { books = JSON.parse(decoded); } catch (e) { books = []; }

    const newBook = {
      title,
      author,
      pdf: pdfPath,
      cover: '', // admin can add cover later
      added: new Date().toISOString()
    };
    books.push(newBook);

    const updatedBooks = Buffer.from(JSON.stringify(books, null, 2)).toString('base64');
    const updateBody = {
      message: `Update books.json: add ${title}`,
      content: updatedBooks,
      sha: currentBooks.data.sha,
      branch: BRANCH
    };
    const updateRes = await githubRequest(booksPath, 'PUT', updateBody, GITHUB_TOKEN);
    if (!updateRes.ok)
      return res.status(updateRes.status).send({ error: updateRes.data.message || 'Failed to update books.json' });

    return res.status(200).send({ success: true, message: 'PDF uploaded and books.json updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Upload failed. Check logs.' });
  }
}
