from sqlalchemy.orm import Session
from . import models, schemas


def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def create_order(db: Session, order_in: schemas.OrderCreate):
    total = 0.0
    items_objs = []
    for it in order_in.items:
        product = get_product(db, it.product_id)
        if not product:
            raise ValueError(f"Produto {it.product_id} não encontrado")
        qty = max(1, int(it.quantity))
        line_total = product.price * qty
        total += line_total
        items_objs.append(models.OrderItem(product_id=product.id, quantity=qty, price=product.price))

    order = models.Order(customer=order_in.customer, total=total)
    order.items = items_objs
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
