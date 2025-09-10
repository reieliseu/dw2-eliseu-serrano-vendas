const API = 'http://localhost:8000'

const IMAGE_MAP = {
  1: 'img/camiseta.svg',
  2: 'img/bone.svg',
  3: 'img/caneca.svg'
}

function getImageForProduct(id){
  return IMAGE_MAP[id] || 'img/camiseta.svg'
}

async function fetchProducts(){
  try{
    const res = await fetch(`${API}/products`)
    if(!res.ok) throw new Error('Falha ao buscar produtos')
    return res.json()
  }catch(e){
    console.error(e)
    // fallback sample products
    return [
      {id:1,name:'Camiseta',description:'Camiseta 100% algodão',price:39.9},
      {id:2,name:'Boné',description:'Boné com logo',price:29.5},
      {id:3,name:'Caneca',description:'Caneca cerâmica 300ml',price:19.0}
    ]
  }
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
  if(!cartItems || !cartTotalEl) return
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
    try{
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
        let detail = 'não foi possível criar pedido'
        try{ const err = await res.json(); detail = err.detail || detail } catch(e){}
        msg.textContent = `Erro: ${detail}`
        msg.className = 'msg error'
      }
    }catch(e){
      console.error(e)
      const msg = document.getElementById('msg')
      msg.textContent = 'Erro de conexão com API'
      msg.className = 'msg error'
    }
  })
}

main().catch(err=>console.error(err))
