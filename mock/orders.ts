import type { Order } from "../types/order"

export const ordersMock: Order[] = [
  {
    "id": "ord-20260301",
    "userId": "user-123",
    "status": "DELIVERED",
    "totalAmount": 255,
    "currency": "USD",
    "items": [
      {
        "id": "oi-1",
        "productId": "d48e464d-f035-4ea9-968f-c63ee44ae241",
        "variantId": "6902daf6-9aae-4974-9d0d-6c46d2d88717",
        "productName": {
          "es": "TV 32'' - IN3200TV",
          "pt": "TV 32'' - IN3200TV"
        },
        "quantity": 1,
        "price": 90,
        "currency": "USD"
      },
      {
        "id": "oi-2",
        "productId": "03a273d2-e122-40bc-8765-7c9ed7dc1ee4",
        "variantId": "86360c42-1cc5-40b7-b1e3-02dd657c6c00",
        "productName": {
          "es": "TV 43'' - IN4300TV",
          "pt": "TV 43'' - IN4300TV"
        },
        "quantity": 1,
        "price": 165,
        "currency": "USD"
      }
    ],
    "createdAt": "2026-03-01T14:30:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z"
  },
  {
    "id": "ord-20260320",
    "userId": "user-123",
    "status": "SHIPPED",
    "totalAmount": 250,
    "currency": "USD",
    "items": [
      {
        "id": "oi-3",
        "productId": "6d5f103f-769f-48cc-ac2d-9a68f41e4337",
        "variantId": "056584ab-1667-49f4-9ba1-284e4d02c0af",
        "productName": {
          "es": "TV 50'' - IN5000TV",
          "pt": "TV 50'' - IN5000TV"
        },
        "quantity": 1,
        "price": 250,
        "currency": "USD"
      }
    ],
    "createdAt": "2026-03-20T09:15:00.000Z",
    "updatedAt": "2026-03-22T16:45:00.000Z"
  },
  {
    "id": "ord-20260405",
    "userId": "user-123",
    "status": "PROCESSING",
    "totalAmount": 660,
    "currency": "USD",
    "items": [
      {
        "id": "oi-4",
        "productId": "4e0b2879-d798-4336-991e-5322c83480a4",
        "variantId": "b3871499-5ba1-42ce-8b35-2ad6991b7681",
        "productName": {
          "es": "TV 55'' - IN5500TV",
          "pt": "TV 55'' - IN5500TV"
        },
        "quantity": 1,
        "price": 275,
        "currency": "USD"
      },
      {
        "id": "oi-5",
        "productId": "58acdb18-e6b9-48a1-b462-1f6016138cd4",
        "variantId": "b20908ed-c0d0-4ddf-8d2e-f52419c60a32",
        "productName": {
          "es": "TV 65'' - IN6500TV",
          "pt": "TV 65'' - IN6500TV"
        },
        "quantity": 1,
        "price": 385,
        "currency": "USD"
      }
    ],
    "createdAt": "2026-04-05T11:00:00.000Z",
    "updatedAt": "2026-04-05T11:00:00.000Z"
  }
]
