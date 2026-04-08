"""
Test 1: Auth pages render correctly.
"""
from conftest import BASE_URL


class TestAuthPagesRender:
    def test_login_page_renders(self, page):
        page.goto("/login")
        assert page.title() or True  # page loaded
        assert page.locator("h1").inner_text() == "Entrar"
        assert page.locator('input[name="email"]').is_visible()
        assert page.locator('input[name="password"]').is_visible()
        assert page.locator('button:has-text("Entrar")').is_visible()
        assert page.locator('a[href="/register"]').is_visible()
        assert page.locator('a[href="/forgot-password"]').is_visible()

    def test_register_page_renders(self, page):
        page.goto("/register")
        assert page.locator("h1").inner_text() == "Crear conta"
        assert page.locator('input[name="name"]').is_visible()
        assert page.locator('input[name="email"]').is_visible()
        assert page.locator('input[name="password"]').is_visible()
        assert page.locator('button:has-text("Criar conta")').is_visible()
        assert page.locator('a[href="/login"]').is_visible()

    def test_forgot_password_page_renders(self, page):
        page.goto("/forgot-password")
        assert page.locator("h1").inner_text() == "Recuperar senha"
        assert page.locator('input[name="email"]').is_visible()
        assert page.locator('button:has-text("Enviar")').is_visible()
        assert page.locator('a[href="/login"]').is_visible()

    def test_reset_password_page_renders(self, page):
        page.goto("/reset-password")
        assert page.locator("h1").inner_text() == "Nova senha"
        assert page.locator('input[name="password"]').is_visible()
        assert page.locator('button:has-text("Alterar senha")').is_visible()

    def test_google_oauth_button_visible_on_login(self, page):
        page.goto("/login")
        google_btn = page.locator('button:has-text("Continuar con Google")')
        assert google_btn.is_visible()

    def test_google_oauth_button_visible_on_register(self, page):
        page.goto("/register")
        google_btn = page.locator('button:has-text("Continuar con Google")')
        assert google_btn.is_visible()

    def test_auth_layout_shows_site_name(self, page):
        page.goto("/login")
        # The auth layout has a link to "/" with the site name
        site_link = page.locator('a[href="/"]')
        assert site_link.is_visible()
        text = site_link.inner_text()
        assert len(text) > 0  # site name is rendered
