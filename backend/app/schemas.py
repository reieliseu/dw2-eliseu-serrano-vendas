from pydantic import BaseModel
from typing import List, Optional


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float


class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    customer: str
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    price: float

    class Config:
        orm_mode = True


class OrderOut(BaseModel):
    id: int
    customer: str
    total: float
    items: List[OrderItemOut]

    class Config:
        orm_mode = True
