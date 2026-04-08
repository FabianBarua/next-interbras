import { describe, it, expect } from "vitest"
import { renderTemplate } from "@/lib/email/render"

describe("renderTemplate", () => {
  it("replaces variables", () => {
    const result = renderTemplate("Hello {{name}}!", { name: "Alice" })
    expect(result).toBe("Hello Alice!")
  })

  it("replaces multiple occurrences of different variables", () => {
    const tpl = "{{greeting}}, {{name}}! Welcome to {{site}}."
    const result = renderTemplate(tpl, {
      greeting: "Hi",
      name: "Bob",
      site: "Interbras",
    })
    expect(result).toBe("Hi, Bob! Welcome to Interbras.")
  })

  it("HTML-escapes values by default", () => {
    const result = renderTemplate("Input: {{val}}", {
      val: '<script>alert("xss")</script>',
    })
    expect(result).toBe(
      'Input: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it("escapes ampersands and quotes", () => {
    const result = renderTemplate("{{v}}", { v: `A & B "C" 'D'` })
    expect(result).toBe("A &amp; B &quot;C&quot; &#39;D&#39;")
  })

  it("leaves unknown variables as-is", () => {
    const result = renderTemplate("{{known}} and {{unknown}}", {
      known: "yes",
    })
    expect(result).toBe("yes and {{unknown}}")
  })

  it("handles empty variables record", () => {
    const result = renderTemplate("Hello {{name}}!", {})
    expect(result).toBe("Hello {{name}}!")
  })

  it("skips HTML escaping for rawKeys", () => {
    const html = '<a href="https://example.com">Link</a>'
    const result = renderTemplate("Click: {{link}}", { link: html }, new Set(["link"]))
    expect(result).toBe(`Click: ${html}`)
  })

  it("only skips escaping for specified rawKeys", () => {
    const result = renderTemplate("{{safe}} {{raw}}", {
      safe: "<b>bold</b>",
      raw: "<b>bold</b>",
    }, new Set(["raw"]))
    expect(result).toBe("&lt;b&gt;bold&lt;/b&gt; <b>bold</b>")
  })

  it("handles template with no variables", () => {
    const result = renderTemplate("No variables here.", { name: "ignored" })
    expect(result).toBe("No variables here.")
  })

  it("handles empty template string", () => {
    const result = renderTemplate("", { name: "test" })
    expect(result).toBe("")
  })
})
