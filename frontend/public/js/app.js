const API = 'http://localhost:8000'

async function fetchProducts(){
  const res = await fetch(`${API}/products`)
  return res.json()
}

function createProductCard(p){
  const el = document.createElement('div')
  el.className = 'card'
  el.innerHTML = `
    <h3>${p.name}</h3>
    <p>${p.description}</p>
    <div class="price">R$ ${p.price.toFixed(2)}</div>
    <label>Qtd <input type="number" min="0" value="0" data-id="${p.id}" /></label>
  `
  return el
}

function updateCartUI(products){
  const cartItems = document.getElementById('cartItems')
  cartItems.innerHTML = ''
  products.forEach(p => {
    const inp = document.querySelector(`input[data-id="${p.id}"]`)
    const qty = parseInt(inp?.value || 0)
    if(qty>0){
      const div = document.createElement('div')
      div.textContent = `${p.name} x ${qty} — R$ ${(p.price*qty).toFixed(2)}`
      cartItems.appendChild(div)
    }
  })
}

async function main(){
  const products = await fetchProducts()
  const container = document.getElementById('products')
  products.forEach(p=>{
    container.appendChild(createProductCard(p))
  })

  container.addEventListener('input',()=> updateCartUI(products))

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
      msg.textContent = `Pedido ${data.id} criado — total R$ ${data.total.toFixed(2)}`
      form.reset()
      updateCartUI(products)
    } else {
      const err = await res.json()
      msg.textContent = `Erro: ${err.detail || 'não foi possível criar pedido'}`
      msg.style.color = 'red'
    }
  })
}

main().catch(err=>console.error(err))
