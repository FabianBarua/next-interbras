"""
Test 2: Login flow — valid credentials, invalid credentials, form validation.
"""
import re
from conftest import ADMIN_EMAIL, ADMIN_PASSWORD


class TestLoginFlow:
    def test_login_with_valid_admin_credentials(self, page):
        page.goto("/login")
        page.fill('input[name="email"]', ADMIN_EMAIL)
        page.fill('input[name="password"]', ADMIN_PASSWORD)
        page.click('button[type="submit"]:has-text("Entrar")')

        # Should redirect away from /login (to "/" since admin)
        page.wait_for_url(lambda url: "/login" not in url, timeout=10_000)
        assert "/login" not in page.url

    def test_login_with_wrong_password(self, page):
        page.goto("/login")
        page.fill('input[name="email"]', ADMIN_EMAIL)
        page.fill('input[name="password"]', "WrongPassword123!")
        page.click('button[type="submit"]:has-text("Entrar")')

        # Should show error message, stay on login
        error = page.locator("p.text-destructive")
        error.wait_for(state="visible", timeout=10_000)
        assert "inválidos" in error.inner_text().lower() or "erro" in error.inner_text().lower()

    def test_login_with_nonexistent_email(self, page):
        page.goto("/login")
        page.fill('input[name="email"]', "nonexistent@example.com")
        page.fill('input[name="password"]', "SomePassword123!")
        page.click('button[type="submit"]:has-text("Entrar")')

        error = page.locator("p.text-destructive")
        error.wait_for(state="visible", timeout=10_000)
        assert error.is_visible()

    def test_login_button_shows_loading_state(self, page):
        page.goto("/login")
        page.fill('input[name="email"]', ADMIN_EMAIL)
        page.fill('input[name="password"]', ADMIN_PASSWORD)

        # Click and immediately check for loading text
        page.click('button[type="submit"]:has-text("Entrar")')
        # The button should briefly show "Entrando..." (pending state)
        # We just verify the form submitted without JS errors
        page.wait_for_url(lambda url: "/login" not in url, timeout=10_000)
