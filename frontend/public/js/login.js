// Simple client-side login demo
const form = document.getElementById('loginForm')
const msg = document.getElementById('loginMsg')
const demo = document.getElementById('demo')

function show(text, type='info'){
  msg.textContent = text
  msg.className = type==='error' ? 'msg error' : 'msg success'
}

form.addEventListener('submit', (e)=>{
  e.preventDefault()
  const email = document.getElementById('email').value.trim()
  const pass = document.getElementById('password').value.trim()
  if(!email || !pass){ show('Preencha e-mail e senha', 'error'); return }
  // Simulate login success
  show('Login bem-sucedido. Redirecionando...')
  setTimeout(()=>{ window.location.href = '/'; }, 900)
})

demo.addEventListener('click', ()=>{
  document.getElementById('email').value = 'demo@exemplo.com'
  document.getElementById('password').value = 'demo'
  form.requestSubmit()
})
