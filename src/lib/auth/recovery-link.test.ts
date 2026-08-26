import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildRecoveryUrl } from "./recovery-link"

describe("buildRecoveryUrl", () => {
  it("points at our portal with token_hash, never the Supabase verify URL", () => {
    const url = buildRecoveryUrl("abc123hashed", "https://ckrea.com.co")
    assert.equal(
      url,
      "https://ckrea.com.co/auth/confirm?token_hash=abc123hashed&type=recovery",
    )
    assert.equal(url?.includes("supabase.co"), false)
    assert.equal(url?.includes("/auth/v1/verify"), false)
  })

  it("strips a trailing slash on the site so the path is not doubled", () => {
    const url = buildRecoveryUrl("tok", "https://ckrea.com.co/")
    assert.equal(url, "https://ckrea.com.co/auth/confirm?token_hash=tok&type=recovery")
  })

  it("returns null when the hashed token is missing", () => {
    assert.equal(buildRecoveryUrl(""), null)
    assert.equal(buildRecoveryUrl("   "), null)
  })
})
