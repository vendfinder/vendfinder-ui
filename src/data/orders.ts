import { Order } from "@/types";

export const orders: Order[] = [
  {
    id: "ORD-2024-001",
    userId: "user-1",
    items: [
      { productName: "Air Jordan 4 Retro Bred", quantity: 1, price: 215 },
      { productName: "Nike Tech Fleece Joggers", quantity: 1, price: 110 },
    ],
    total: 325,
    status: "delivered",
    date: "2024-09-15",
    trackingNumber: "1Z999AA10123456784",
  },
  {
    id: "ORD-2024-002",
    userId: "user-1",
    items: [
      { productName: "Sony WH-1000XM5 Headphones", quantity: 1, price: 348 },
    ],
    total: 348,
    status: "shipped",
    date: "2024-10-20",
    trackingNumber: "1Z999AA10123456785",
  },
  {
    id: "ORD-2024-003",
    userId: "user-1",
    items: [
      { productName: "Casio G-Shock GA-2100", quantity: 1, price: 99 },
      { productName: "Herschel Retreat Backpack", quantity: 1, price: 80 },
      { productName: "Supreme Box Logo Tee", quantity: 2, price: 136 },
    ],
    total: 315,
    status: "processing",
    date: "2024-11-01",
  },
  {
    id: "ORD-2024-004",
    userId: "user-1",
    items: [
      { productName: "Funko Pop! Spider-Man Exclusive", quantity: 1, price: 45 },
    ],
    total: 45,
    status: "cancelled",
    date: "2024-08-10",
  },
];
