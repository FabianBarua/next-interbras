import { describe, it, expect } from "vitest"
import { z } from "zod/v4"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas"

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = z.safeParse(registerSchema, {
      name: "John Doe",
      email: "john@example.com",
      password: "MyPassword123",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("john@example.com")
      expect(result.data.name).toBe("John Doe")
    }
  })

  it("lowercases email", () => {
    const result = z.safeParse(registerSchema, {
      name: "Test",
      email: "UPPER@Example.COM",
      password: "12345678",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("upper@example.com")
    }
  })

  it("trims name", () => {
    const result = z.safeParse(registerSchema, {
      name: "  Padded Name  ",
      email: "a@b.com",
      password: "12345678",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Padded Name")
    }
  })

  it("rejects name shorter than 2 chars", () => {
    const result = z.safeParse(registerSchema, {
      name: "A",
      email: "a@b.com",
      password: "12345678",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = z.safeParse(registerSchema, {
      name: "Test",
      email: "not-an-email",
      password: "12345678",
    })
    expect(result.success).toBe(false)
  })

  it("rejects password shorter than 8 characters", () => {
    const result = z.safeParse(registerSchema, {
      name: "Test",
      email: "a@b.com",
      password: "1234567",
    })
    expect(result.success).toBe(false)
  })

  it("rejects password longer than 72 characters", () => {
    const result = z.safeParse(registerSchema, {
      name: "Test",
      email: "a@b.com",
      password: "a".repeat(73),
    })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = z.safeParse(loginSchema, {
      email: "user@test.com",
      password: "x",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty password", () => {
    const result = z.safeParse(loginSchema, {
      email: "user@test.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })

  it("lowercases email", () => {
    const result = z.safeParse(loginSchema, {
      email: "USER@Test.COM",
      password: "pass",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("user@test.com")
    }
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = z.safeParse(forgotPasswordSchema, {
      email: "user@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = z.safeParse(forgotPasswordSchema, {
      email: "bad",
    })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepts valid input", () => {
    const result = z.safeParse(resetPasswordSchema, {
      token: "abc123",
      password: "NewPass123!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty token", () => {
    const result = z.safeParse(resetPasswordSchema, {
      token: "",
      password: "ValidPass1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects short password", () => {
    const result = z.safeParse(resetPasswordSchema, {
      token: "validtoken",
      password: "1234567",
    })
    expect(result.success).toBe(false)
  })

  it("rejects token longer than 64 chars", () => {
    const result = z.safeParse(resetPasswordSchema, {
      token: "a".repeat(65),
      password: "ValidPass1",
    })
    expect(result.success).toBe(false)
  })
})
