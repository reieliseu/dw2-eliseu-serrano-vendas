Mini sistema de vendas — frontend estático e backend em FastAPI + SQLite

Instruções rápidas:

1) Backend
- Abra um terminal na pasta `backend`
- Crie um virtualenv: `python -m venv .venv` e ative
- Instale dependências: `pip install -r requirements.txt`
- Execute: `uvicorn app.main:app --reload --port 8000`

A API ficará em http://localhost:8000
Endpoints úteis:
- GET /products
- POST /orders  (body: {"customer":"nome","items":[{"product_id":1,"quantity":2}]})

2) Frontend
- Abra `frontend/public/html/index.html` no navegador (ou sirva com um servidor estático)
- O frontend consome a API em http://localhost:8000

Testes: use Thunder Client ou Insomnia para testar os endpoints.
