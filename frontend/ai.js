const API_BASE = 'http://127.0.0.1:8007'
document.getElementById('run').addEventListener('click', async ()=>{
  const applicantText = document.getElementById('applicant').value;
  const scholarshipsText = document.getElementById('scholarships').value;
  let applicant, scholarships
  try{
    applicant = JSON.parse(applicantText)
    scholarships = JSON.parse(scholarshipsText)
  }catch(e){ return alert('Invalid JSON') }

  const res = await fetch(`${API_BASE}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant, scholarships })
  })
  // Note: ai-service /match expects applicant and list as body directly; we'll adapt below if needed
  // For current ai-service we send applicant as first argument and scholarships as second in body
  // If the endpoint expects raw applicant and separate param, adjust accordingly.
  if (!res.ok) {
    const err = await res.json().catch(()=>({detail:'unknown'}));
    return alert('Error: ' + (err.detail || JSON.stringify(err)));
  }
  const data = await res.json()
  document.getElementById('res').textContent = JSON.stringify(data, null, 2)
})
