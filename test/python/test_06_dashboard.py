"""
Test 6: Dashboard layout and navigation.
"""


class TestDashboardLayout:
    def test_dashboard_has_sidebar(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        # Desktop sidebar should be present (hidden on mobile but in DOM)
        sidebar = admin_page.locator("aside")
        assert sidebar.count() > 0

    def test_dashboard_has_nav_links(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        # Should have at least Dashboard link in sidebar
        dash_link = admin_page.locator('a[href="/dashboard"]')
        assert dash_link.count() > 0

    def test_dashboard_has_logout_button(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        logout_btn = admin_page.locator('button:has-text("Sair")')
        assert logout_btn.count() > 0

    def test_dashboard_has_site_link(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        # "Ver sitio" link to "/"
        site_link = admin_page.locator('a:has-text("Ver sitio")')
        assert site_link.count() > 0

    def test_dashboard_welcome_message(self, admin_page):
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        welcome = admin_page.locator("text=Bienvenido")
        assert welcome.is_visible()
