"""
Test 4: Forgot password flow.
"""
from conftest import ADMIN_EMAIL


class TestForgotPasswordFlow:
    def test_forgot_password_shows_success(self, page):
        """Should always show success (email enumeration protection)."""
        page.goto("/forgot-password")
        page.fill('input[name="email"]', ADMIN_EMAIL)
        page.click('button[type="submit"]:has-text("Enviar")')

        success = page.locator("p.text-primary")
        success.wait_for(state="visible", timeout=10_000)
        assert "link" in success.inner_text().lower() or "email" in success.inner_text().lower()

    def test_forgot_password_nonexistent_email_also_succeeds(self, page):
        """Should NOT reveal that the email doesn't exist."""
        page.goto("/forgot-password")
        page.fill('input[name="email"]', "nonexistent@nobody.com")
        page.click('button[type="submit"]:has-text("Enviar")')

        success = page.locator("p.text-primary")
        success.wait_for(state="visible", timeout=10_000)
        assert success.is_visible()

    def test_reset_password_invalid_token(self, page):
        """Should show error for invalid token."""
        page.goto("/reset-password?token=invalidtoken123")
        page.fill('input[name="password"]', "NewPassword123!")
        page.click('button[type="submit"]:has-text("Alterar senha")')

        error = page.locator("p.text-destructive")
        error.wait_for(state="visible", timeout=10_000)
        assert "inválido" in error.inner_text().lower() or "expirado" in error.inner_text().lower()
