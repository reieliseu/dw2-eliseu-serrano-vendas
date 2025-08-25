from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import SessionLocal, get_db, engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini Vendas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_seed():
    db = SessionLocal()
    try:
        if not db.query(models.Product).first():
            sample = [
                models.Product(name="Camiseta", description="Camiseta 100% algodão", price=39.9),
                models.Product(name="Boné", description="Boné com logo", price=29.5),
                models.Product(name="Caneca", description="Caneca cerâmica 300ml", price=19.0),
            ]
            db.add_all(sample)
            db.commit()
    finally:
        db.close()


@app.get("/products", response_model=list[schemas.Product])
def list_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return p


@app.post("/orders", response_model=schemas.OrderOut)
def create_order_endpoint(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = crud.create_order(db, order_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # build response
    items = [schemas.OrderItemOut(product_id=i.product_id, quantity=i.quantity, price=i.price) for i in order.items]
    return schemas.OrderOut(id=order.id, customer=order.customer, total=order.total, items=items)
