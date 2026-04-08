import { describe, it, expect, beforeAll } from "vitest"
import { encrypt, decrypt } from "@/lib/crypto"

// A valid 64-char hex key (32 bytes)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})

describe("encrypt / decrypt", () => {
  it("round-trips a simple string", () => {
    const plain = "Hello, World!"
    const cipher = encrypt(plain)
    expect(decrypt(cipher)).toBe(plain)
  })

  it("round-trips an empty string", () => {
    const cipher = encrypt("")
    expect(decrypt(cipher)).toBe("")
  })

  it("round-trips unicode text", () => {
    const plain = "Ação de graças 🎉 日本語"
    const cipher = encrypt(plain)
    expect(decrypt(cipher)).toBe(plain)
  })

  it("produces different ciphertexts for same input (random IV)", () => {
    const plain = "same input"
    const c1 = encrypt(plain)
    const c2 = encrypt(plain)
    expect(c1).not.toBe(c2)
    expect(decrypt(c1)).toBe(plain)
    expect(decrypt(c2)).toBe(plain)
  })

  it("ciphertext has iv:tag:data format", () => {
    const cipher = encrypt("test")
    const parts = cipher.split(":")
    expect(parts).toHaveLength(3)
    // IV = 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32)
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32)
    // Data is non-empty hex
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it("throws on tampered ciphertext", () => {
    const cipher = encrypt("secret")
    const parts = cipher.split(":")
    // Flip a byte in the encrypted data
    const tampered = parts[0] + ":" + parts[1] + ":ff" + parts[2].slice(2)
    expect(() => decrypt(tampered)).toThrow()
  })

  it("throws on invalid format", () => {
    expect(() => decrypt("not:valid")).toThrow("Invalid ciphertext format")
    expect(() => decrypt("")).toThrow("Invalid ciphertext format")
  })

  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY")
    process.env.ENCRYPTION_KEY = saved
  })

  it("throws when ENCRYPTION_KEY is wrong length", () => {
    const saved = process.env.ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = "tooshort"
    expect(() => encrypt("test")).toThrow("64 hex characters")
    process.env.ENCRYPTION_KEY = saved
  })
})
