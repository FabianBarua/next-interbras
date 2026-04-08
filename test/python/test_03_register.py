"""
Test 3: Registration flow — new user, duplicate email.
"""
import uuid


def unique_email():
    return f"testuser_{uuid.uuid4().hex[:8]}@test.com"


class TestRegisterFlow:
    def test_register_new_user(self, page):
        email = unique_email()
        page.goto("/register")
        page.fill('input[name="name"]', "Test User")
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', "TestPass123!")
        page.click('button[type="submit"]:has-text("Criar conta")')

        # Should redirect to "/" after successful registration + auto-login
        page.wait_for_url(lambda url: "/register" not in url, timeout=15_000)
        assert "/register" not in page.url

    def test_register_duplicate_email(self, page):
        # First register
        email = unique_email()
        page.goto("/register")
        page.fill('input[name="name"]', "First User")
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', "TestPass123!")
        page.click('button[type="submit"]:has-text("Criar conta")')
        page.wait_for_url(lambda url: "/register" not in url, timeout=15_000)

        # Clear session — open new context
        page.context.clear_cookies()
        page.goto("/register")
        page.fill('input[name="name"]', "Second User")
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', "TestPass123!")
        page.click('button[type="submit"]:has-text("Criar conta")')

        # Should show "already registered" error
        error = page.locator("p.text-destructive")
        error.wait_for(state="visible", timeout=10_000)
        assert "cadastrado" in error.inner_text().lower() or "email" in error.inner_text().lower()

    def test_register_short_password_validation(self, page):
        page.goto("/register")
        page.fill('input[name="name"]', "Test User")
        page.fill('input[name="email"]', unique_email())
        page.fill('input[name="password"]', "short")
        page.click('button[type="submit"]:has-text("Criar conta")')

        error = page.locator("p.text-destructive")
        error.wait_for(state="visible", timeout=10_000)
        assert "8" in error.inner_text() or "mínimo" in error.inner_text().lower()
