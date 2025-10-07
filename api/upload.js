// api/upload.js
// - verifies x-admin-token header
// - parses multipart form data (pdf file + title + author)
// - commits PDF file to repo at pdfs/<safe-filename>.pdf
// - fetches books.json, inserts new entry, and updates books.json

import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

async function verifyToken(token){
  if(!token) return false;
  try{
    const [b64, sig] = token.split('.');
    const payload = Buffer.from(b64, 'base64').toString('utf8');
    const crypto = await import('crypto');
    const secret = process.env.ADMIN_SECRET || 'very-secret-change-me';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if(expected !== sig) return false;
    // optionally check iat for freshness
    return true;
  } catch(e){ return false; }
}

function safeFileName(title){
  // make a safe filename from title
  return title.replace(/[^a-z0-9\-_.]/gi, '-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase();
}

async function parseForm(req){
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject)=>{
    form.parse(req, (err, fields, files)=>{
      if(err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function githubRequest(path, method='GET', body=null, token=null){
  const base = 'https://api.github.com';
  const headers = { 'User-Agent':'ebook-site-admin' , 'Accept':'application/vnd.github+json' };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try{ json = JSON.parse(text); } catch(e){ json = { raw:text }; }
  return { ok: res.ok, status: res.status, data: json };
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).send({ error:'Method not allowed' });

  const tokenHeader = req.headers['x-admin-token'] || '';
  const ok = await verifyToken(tokenHeader);
  if(!ok) return res.status(401).send({ error:'Invalid admin token' });

  try{
    const { fields, files } = await parseForm(req);
    const title = (fields.title || '').trim();
    const author = (fields.author || '').trim() || 'Unknown';
    if(!title) return res.status(400).send({ error:'Missing title' });
    if(!files.pdf) return res.status(400).send({ error:'Missing pdf file' });

    const pdf = files.pdf; // formidable file
    const raw = await fs.promises.readFile(pdf.filepath);
    const base64 = raw.toString('base64');

    // repo settings from env
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.REPO_OWNER;
    const REPO = process.env.REPO_NAME;
    const BRANCH = process.env.REPO_BRANCH || 'main';
    if(!GITHUB_TOKEN || !OWNER || !REPO) return res.status(500).send({ error:'Server misconfigured (missing GITHUB_TOKEN / REPO_OWNER / REPO_NAME)' });

    // make a safe filename
    const safe = safeFileName(title) || `book-${Date.now()}`;
    const pdfPath = `pdfs/${safe}.pdf`;

    // 1) Create the PDF file in repo
    const createPath = `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(pdfPath)}`;
    const createBody = {
