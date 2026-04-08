"""
Test 5: Middleware protection — dashboard, auth page redirects.
"""
from conftest import ADMIN_EMAIL, ADMIN_PASSWORD


class TestMiddlewareProtection:
    def test_dashboard_redirects_unauthenticated_to_login(self, page):
        resp = page.goto("/dashboard")
        # Should end up on /login
        assert "/login" in page.url

    def test_dashboard_accessible_by_admin(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        assert "/dashboard" in admin_page.url
        assert admin_page.locator("h1:has-text('Dashboard')").is_visible()

    def test_login_redirects_authenticated_user(self, admin_page):
        admin_page.goto("/login")
        # Middleware should redirect logged-in user away from /login
        admin_page.wait_for_url(lambda url: "/login" not in url, timeout=10_000)
        assert "/login" not in admin_page.url

    def test_register_redirects_authenticated_user(self, admin_page):
        admin_page.goto("/register")
        admin_page.wait_for_url(lambda url: "/register" not in url, timeout=10_000)
        assert "/register" not in admin_page.url

    def test_dashboard_shows_admin_info(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        # Dashboard layout should show admin name and email
        assert admin_page.locator("text=Admin").first.is_visible()
