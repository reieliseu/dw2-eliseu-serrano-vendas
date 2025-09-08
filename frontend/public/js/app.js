* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background: #f5f5f5;
  color: #333;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background: #ff6f61;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header .logo {
  font-size: 1.8rem;
  font-weight: bold;
}

header nav a {
  color: white;
  text-decoration: none;
  margin-left: 1rem;
  font-weight: bold;
  transition: opacity 0.3s;
}

header nav a:hover {
  opacity: 0.8;
}

main {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  flex: 1;
}

#catalog {
  flex: 3;
}

#catalog h2 {
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-card img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.product-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.product-card p {
  font-size: 0.95rem;
  margin-bottom: 0.8rem;
}

.product-card button {
  background: #ff6f61;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.product-card button:hover {
  background: #e65c50;
}

#cart {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  height: fit-content;
}

#cart h2 {
  margin-bottom: 1rem;
}

#cart input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.actions button {
  width: 100%;
  padding: 0.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

.actions button:hover {
  background: #43a047;
}

footer {
  text-align: center;
  padding: 1rem;
  background: #333;
  color: white;
}

/* Responsividade */
@media(max-width: 900px) {
  main {
    flex-direction: column;
  }
}

const API = 'http://localhost:8000'

const IMAGE_MAP = {
  1: '../img/camiseta.svg',
  2: '../img/bone.svg',
  3: '../img/caneca.svg'
}

function getImageForProduct(id){
  return IMAGE_MAP[id] || '../img/camiseta.svg'
}

async function fetchProducts(){
  const res = await fetch(`${API}/products`)
  if(!res.ok) throw new Error('Falha ao buscar produtos')
  return res.json()
}

function formatCurrency(v){
  return v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})
}

function createProductCard(p){
  const el = document.createElement('div')
  el.className = 'card'
  el.innerHTML = `
    <img class="thumb" src="${getImageForProduct(p.id)}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p>${p.description}</p>
    <div class="price">R$ ${formatCurrency(p.price)}</div>
    <div class="controls">
      <label>Qtd <input type="number" min="0" value="0" data-id="${p.id}" /></label>
      <button type="button" data-add="${p.id}" class="btn-secondary">Adicionar</button>
    </div>
  `
  return el
}

function updateCartUI(products){
  const cartItems = document.getElementById('cartItems')
  const cartTotalEl = document.getElementById('cartTotal')
  cartItems.innerHTML = ''
  let total = 0
  products.forEach(p => {
    const inp = document.querySelector(`input[data-id="${p.id}"]`)
    const qty = parseInt(inp?.value || 0)
    if(qty>0){
      const div = document.createElement('div')
      div.className = 'cart-item'
      div.innerHTML = `<span>${p.name} x ${qty}</span><span>R$ ${formatCurrency(p.price*qty)}</span>`
      cartItems.appendChild(div)
      total += p.price*qty
    }
  })
  cartTotalEl.textContent = `R$ ${formatCurrency(total)}`
}

async function main(){
  const products = await fetchProducts()
  const container = document.getElementById('products')
  products.forEach(p=>{
    container.appendChild(createProductCard(p))
  })

  container.addEventListener('input',()=> updateCartUI(products))
  container.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-add]')
    if(btn){
      const id = btn.getAttribute('data-add')
      const inp = document.querySelector(`input[data-id="${id}"]`)
      if(inp){ inp.value = Math.max(1, parseInt(inp.value||0)+1); updateCartUI(products) }
    }
  })

  const form = document.getElementById('orderForm')
  form.addEventListener('submit', async (e)=>{
    e.preventDefault()
    const customer = document.getElementById('customer').value.trim()
    if(!customer){ alert('Preencha nome do cliente'); return }
    const items = []
    products.forEach(p=>{
      const qty = parseInt(document.querySelector(`input[data-id="${p.id}"]`).value||0)
      if(qty>0) items.push({product_id:p.id, quantity:qty})
    })
    if(items.length===0){ alert('Carrinho vazio'); return }
    const res = await fetch(`${API}/orders`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({customer, items})
    })
    const msg = document.getElementById('msg')
    if(res.ok){
      const data = await res.json()
      msg.textContent = `Pedido ${data.id} criado — total R$ ${formatCurrency(data.total)}`
      msg.className = 'msg success'
      form.reset()
      updateCartUI(products)
    } else {
      const err = await res.json()
      msg.textContent = `Erro: ${err.detail || 'não foi possível criar pedido'}`
      msg.className = 'msg error'
    }
  })
}

main().catch(err=>console.error(err))