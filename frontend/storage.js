const API_BASE = 'http://127.0.0.1:8006'

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('file');
  const token = document.getElementById('token').value;
  if (!fileInput.files.length) return alert('Choose a file');

  const form = new FormData();
  form.append('file', fileInput.files[0]);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  });
  if (res.ok) {
    alert('Upload successful');
    loadFiles();
  } else {
    const err = await res.json().catch(()=>({detail:'unknown'}));
    alert('Error: ' + (err.detail || JSON.stringify(err)));
  }
});

document.getElementById('refresh').addEventListener('click', loadFiles);

async function loadFiles(){
  const token = document.getElementById('token').value;
  const res = await fetch(`${API_BASE}/files`, { headers: { 'Authorization': `Bearer ${token}` } });
  const ul = document.getElementById('files');
  ul.innerHTML = '';
  if (!res.ok) { ul.innerHTML = '<li>Failed to load</li>'; return; }
  const list = await res.json();
  for (const f of list){
    const li = document.createElement('li');
    li.innerHTML = `${f.filename} <a href='${API_BASE}/download/${f.id}' target='_blank'>Download</a>`;
    ul.appendChild(li);
  }
}
