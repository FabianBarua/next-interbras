import type { UserProfile } from "../types/user"

export const userProfileMock: UserProfile = {
  id: "user-123",
  name: "Juan García",
  email: "juan.garcia@example.com",
  phone: "+595 981 234567",
  documentType: "CI",
  documentNumber: "1234567",
  nationality: "PY",
  isOAuth: false,
  createdAt: "2025-01-15T10:30:00.000Z",
  addresses: [
    {
      id: "addr-1",
      name: "Casa",
      street: "Av. San Blas 1234",
      city: "Ciudad del Este",
      state: "Alto Paraná",
      zipCode: "7000",
      countryCode: "PY",
      isDefault: true,
    },
    {
      id: "addr-2",
      name: "Oficina",
      street: "Av. Adrián Jara 456",
      city: "Ciudad del Este",
      state: "Alto Paraná",
      zipCode: "7000",
      countryCode: "PY",
      isDefault: false,
    },
  ],
}
