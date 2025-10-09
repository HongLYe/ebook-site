// Simple admin upload client — no login, just static token
const uploadBox = document.getElementById('uploadBox');
const status = document.getElementById('status');

function show(msg, ok = true) {
  status.textContent = msg;
  status.style.color = ok ? 'green' : 'crimson';
}

// === YOUR ADMIN TOKEN HERE ===
// Generate it using the Node script or from ChatGPT instructions earlier
const ADMIN_TOKEN = "eyJpYXQiOjE3NjAwMTM2ODgzMzh9.986262caa68f9532883bbf559c00afebaf6c177952d4881fa5e241fed9f8afca";
 

// Upload handler
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const fileInput = document.getElementById('pdffile');
  if (!title) { show('Please enter the book title', false); return; }
  if (!fileInput.files || fileInput.files.length === 0) { show('Please choose a PDF file', false); return; }
  
  const file = fileInput.files[0];
  if (file.type !== 'application/pdf') { show('Selected file is not a PDF', false); return; }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('author', author);
  fd.append('pdf', file);

  show('Uploading...');
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: fd
    });
    const j = await res.json();
    if (res.ok) {
      show('✅ Upload complete — file saved and books.json updated.');
      document.getElementById('title').value = '';
      document.getElementById('author').value = '';
      fileInput.value = '';
    } else {
      console.error('Upload failed:', j);
      show('❌ ' + (j.error || 'Upload failed'), false);
    }
  } catch (e) {
    console.error(e);
    show('❌ Upload error', false);
  }
});
