import type { StoreLocation } from "../types/store-location"

export const storesMock: StoreLocation[] = [
  {
    id: "store-1",
    name: "Casa Matriz - Ciudad del Este",
    address: "Av. Monseñor Rodríguez esq. Itá Ybaté",
    city: "Ciudad del Este",
    country: "Paraguay",
    phone: "+595 61 500 500",
    email: "cde@interbras.com",
    businessHours: { es: "Lunes a Viernes 07:00 a 16:30 | Sábados 07:00 a 12:00", pt: "Segunda a Sexta 07:00 às 16:30 | Sábado 07:00 às 12:00" },
    coordinates: { lat: -25.5085, lng: -54.6111 },
  },
  {
    id: "store-2",
    name: "Showroom Asunción",
    address: "Av. Aviadores del Chaco 2050",
    city: "Asunción",
    country: "Paraguay",
    phone: "+595 21 600 600",
    businessHours: { es: "Lunes a Viernes 08:00 a 18:00 | Sábados 08:00 a 12:00", pt: "Segunda a Sexta 08:00 às 18:00 | Sábado 08:00 às 12:00" },
    coordinates: { lat: -25.2865, lng: -57.5701 },
  },
  {
    id: "store-3",
    name: "Depósito Hernandarias",
    address: "Zona Industrial - Km 8",
    city: "Hernandarias",
    country: "Paraguay",
    phone: "+595 61 500 510",
    businessHours: { es: "Lunes a Viernes 07:00 a 16:00", pt: "Segunda a Sexta 07:00 às 16:00" },
    coordinates: { lat: -25.4055, lng: -54.6333 },
  },
]
