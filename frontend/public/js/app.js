const API = 'http://localhost:8000'

const IMAGE_MAP = {
  1: 'img/camiseta.svg',
  2: 'img/bone.svg',
  3: 'img/caneca.svg'
}

function getImageForProduct(id){
  return IMAGE_MAP[id] || 'img/camiseta.svg'
}

const STORAGE_KEY = 'mini-vendas-cart'
function loadCartFromStorage(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }catch(e){ return {} }
}
function saveCartToStorage(cart){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) }catch(e){ console.warn('Não foi possível salvar o carrinho', e) }
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

// Render product card (click opens modal)
function createProductCard(p){
  const el = document.createElement('article')
  el.className = 'card'
  el.dataset.id = p.id
  el.innerHTML = `
    <button class="card-body" data-open="${p.id}" aria-label="Abrir ${p.name}">
      <img class="thumb" src="${getImageForProduct(p.id)}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="muted">${p.description}</p>
      <div class="card-footer">
        <div class="price">R$ ${formatCurrency(p.price)}</div>
        <div class="controls">
          <label class="sr-only">Quantidade</label>
          <input type="number" min="0" value="0" data-id="${p.id}" />
          <button type="button" data-add="${p.id}" class="btn-secondary">Adicionar</button>
        </div>
      </div>
    </button>
  `
  return el
}

// App state and UI updates
function updateCartCount(){
  const cart = loadCartFromStorage()
  const count = Object.values(cart).reduce((s,v)=> s + (parseInt(v)||0), 0)
  const el = document.getElementById('cartCount')
  if(el) el.textContent = count
}

function buildDrawerCart(products){
  const cartItemsEl = document.getElementById('cartItems')
  const cartTotalEl = document.getElementById('cartTotal')
  const emptyEl = document.getElementById('emptyCart')
  if(!cartItemsEl || !cartTotalEl) return
  cartItemsEl.innerHTML = ''
  const cart = loadCartFromStorage()
  let total = 0
  products.forEach(p => {
    const qty = parseInt(cart[p.id] || 0)
    if(qty>0){
      const item = document.createElement('div')
      item.className = 'cart-item'
      item.innerHTML = `
        <div class="cart-item-left"><strong>${p.name}</strong> <small class="muted">x ${qty}</small></div>
        <div class="cart-item-right">R$ ${formatCurrency(p.price * qty)} <button class="btn-clear" data-remove="${p.id}" title="Remover">✕</button></div>
      `
      cartItemsEl.appendChild(item)
      total += p.price * qty
    }
  })
  emptyEl.style.display = total===0 ? 'block' : 'none'
  cartTotalEl.textContent = `R$ ${formatCurrency(total)}`
  updateCartCount()
}

// Modal helpers
function openModal(product){
  const modal = document.getElementById('productModal')
  if(!modal) return
  modal.setAttribute('aria-hidden','false')
  modal.style.display = 'block'
  document.getElementById('modalImg').src = getImageForProduct(product.id)
  document.getElementById('modalImg').alt = product.name
  document.getElementById('modalTitle').textContent = product.name
  document.getElementById('modalDesc').textContent = product.description
  document.getElementById('modalPrice').textContent = formatCurrency(product.price)
  document.getElementById('modalQty').value = 1
  // attach add action
  const modalAdd = document.getElementById('modalAdd')
  modalAdd.onclick = ()=>{
    const qty = Math.max(1, parseInt(document.getElementById('modalQty').value||1))
    const cart = loadCartFromStorage(); cart[product.id] = (parseInt(cart[product.id]||0) + qty); saveCartToStorage(cart)
    buildDrawerCart(window.__products)
    closeModal()
  }
}
function closeModal(){
  const modal = document.getElementById('productModal')
  if(!modal) return
  modal.setAttribute('aria-hidden','true')
  modal.style.display = 'none'
}

// Drawer helpers
function openDrawer(){
  const d = document.getElementById('drawerCart')
  if(!d) return
  d.setAttribute('aria-hidden','false')
  d.classList.add('open')
}
function closeDrawer(){
  const d = document.getElementById('drawerCart')
  if(!d) return
  d.setAttribute('aria-hidden','true')
  d.classList.remove('open')
}

// Search and sort utilities
function applySearchAndSort(products){
  const q = (document.getElementById('search')?.value || '').toLowerCase().trim()
  const sort = document.getElementById('sort')?.value || 'popular'
  let filtered = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  if(sort === 'price-asc') filtered.sort((a,b)=> a.price - b.price)
  else if(sort === 'price-desc') filtered.sort((a,b)=> b.price - a.price)
  // else keep original
  return filtered
}

// Checkout: ask customer name and send order
async function checkout(products){
  const cart = loadCartFromStorage()
  const items = []
  products.forEach(p=>{
    const q = parseInt(cart[p.id]||0)
    if(q>0) items.push({product_id:p.id, quantity:q})
  })
  if(items.length===0){ alert('Carrinho vazio'); return }
  const customer = prompt('Nome do cliente:')
  if(!customer || !customer.trim()){ alert('Nome é obrigatório'); return }
  try{
    const res = await fetch(`${API}/orders`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({customer: customer.trim(), items})
    })
    if(res.ok){
      const data = await res.json()
      alert(`Pedido ${data.id} criado — total R$ ${formatCurrency(data.total)}`)
      saveCartToStorage({})
      buildDrawerCart(products)
      closeDrawer()
    } else {
      let detail = 'não foi possível criar pedido'
      try{ const err = await res.json(); detail = err.detail || detail }catch(e){}
      alert('Erro: ' + detail)
    }
  }catch(e){
    console.error(e)
    alert('Erro de conexão com API')
  }
}

// Main
async function main(){
  const products = await fetchProducts()
  // store in global for easy access
  window.__products = products
  const container = document.getElementById('products')
  function render(){
    container.innerHTML = ''
    const list = applySearchAndSort(products)
    if(list.length===0){ container.innerHTML = '<p class="muted">Nenhum produto encontrado</p>' ; return }
    list.forEach(p=> container.appendChild(createProductCard(p)))
    // set quantity inputs from cart
    const cart = loadCartFromStorage()
    Object.keys(cart).forEach(id => { const inp = document.querySelector(`input[data-id="${id}"]`); if(inp) inp.value = cart[id] })
    buildDrawerCart(products)
  }

  render()

  // search and sort events
  document.getElementById('search')?.addEventListener('input', ()=> render())
  document.getElementById('sort')?.addEventListener('change', ()=> render())

  // open modal when clicking product card body
  container.addEventListener('click', (e)=>{
    const openBtn = e.target.closest('[data-open]')
    if(openBtn){
      const id = parseInt(openBtn.getAttribute('data-open'))
      const p = products.find(x=> x.id===id)
      if(p) openModal(p)
      return
    }
    const addBtn = e.target.closest('button[data-add]')
    if(addBtn){
      const id = addBtn.getAttribute('data-add')
      const inp = document.querySelector(`input[data-id="${id}"]`)
      if(inp){ inp.value = Math.max(1, parseInt(inp.value||0)+1); const cart = loadCartFromStorage(); cart[id] = parseInt(inp.value); saveCartToStorage(cart); buildDrawerCart(products) }
    }
  })

  // modal close
  document.querySelector('.modal-close')?.addEventListener('click', closeModal)
  document.getElementById('productModal')?.addEventListener('click', (e)=>{ if(e.target.id==='productModal') closeModal() })

  // drawer open/close
  document.getElementById('btnCart')?.addEventListener('click', ()=>{ buildDrawerCart(products); openDrawer() })
  document.getElementById('closeCart')?.addEventListener('click', closeDrawer)
  // remove item from drawer
  document.getElementById('cartItems')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-remove]')
    if(btn){ const id = btn.getAttribute('data-remove'); const cart = loadCartFromStorage(); delete cart[id]; saveCartToStorage(cart); buildDrawerCart(products) }
  })

  // clear and checkout
  document.getElementById('clearCart')?.addEventListener('click', ()=>{ saveCartToStorage({}); buildDrawerCart(products) })
  document.getElementById('checkout')?.addEventListener('click', ()=> checkout(products))

  // initialize
  updateCartCount()
}

main().catch(err=>console.error(err))
