// Simple admin client: login -> upload PDF -> call /api/upload
const loginBox = document.getElementById('loginBox');
const uploadBox = document.getElementById('uploadBox');
const status = document.getElementById('status');

function show(msg, ok=true){
  status.textContent = msg;
  status.style.color = ok ? 'green' : 'crimson';
}

// login
document.getElementById('loginBtn').addEventListener('click', async()=>{
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  if(!user || !pass){ show('Enter username and password', false); return; }

  // call login endpoint
  try{
    const res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user, pass}) });
    const j = await res.json();
    if(res.ok && j.token){
      localStorage.setItem('admin_token', j.token);
      loginBox.classList.add('hidden');
      uploadBox.classList.remove('hidden');
      show('Logged in — ready to upload');
    } else show(j.error || 'Login failed', false);
  } catch(e){ show('Network/login error', false); }
});

// logout
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  localStorage.removeItem('admin_token');
  uploadBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
  show('');
});

// upload
document.getElementById('uploadBtn').addEventListener('click', async()=>{
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const fileInput = document.getElementById('pdffile');
  if(!title){ show('Please enter the book title', false); return; }
  if(!fileInput.files || fileInput.files.length===0){ show('Please choose a PDF file', false); return; }
  const file = fileInput.files[0];
  if(file.type !== 'application/pdf'){ show('Selected file is not a PDF', false); return; }

  const token = localStorage.getItem('admin_token');
  if(!token){ show('Not authenticated', false); return; }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('author', author);
  fd.append('pdf', file);

  show('Uploading...');
  try{
    const res = await fetch('/api/upload', { method:'POST', body: fd, headers: { 'x-admin-token': token } });
    const j = await res.json();
    if(res.ok){
      show('Upload complete — file saved and books.json updated.');
      // reset
      document.getElementById('title').value='';
      document.getElementById('author').value='';
      fileInput.value='';
    } else show(j.error || 'Upload failed', false);
  } catch(e){ show('Upload error', false); }
});

// attempt auto-login if token exists
window.addEventListener('load', ()=>{
  const t = localStorage.getItem('admin_token');
  if(t){ loginBox.classList.add('hidden'); uploadBox.classList.remove('hidden'); show('Restored session'); }
});
