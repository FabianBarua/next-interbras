"""
Test 7: Full dashboard → logout → verify redirect flow.
Uses pre-authenticated admin_page to avoid rate limit issues.
"""


class TestFullAuthFlow:
    def test_dashboard_logout_redirects(self, admin_page):
        # 1. Go to dashboard — should work (already authenticated)
        admin_page.goto("/dashboard")
        admin_page.wait_for_load_state("networkidle")
        assert "/dashboard" in admin_page.url
        assert admin_page.locator("h1:has-text('Dashboard')").is_visible()

        # 2. Click logout
        logout_btn = admin_page.locator('button:has-text("Sair")')
        logout_btn.click()
        admin_page.wait_for_url(lambda url: "/dashboard" not in url, timeout=15_000)

        # 3. Verify logged out — try to access dashboard again
        admin_page.goto("/dashboard")
        admin_page.wait_for_url(lambda url: "/login" in url, timeout=10_000)
        assert "/login" in admin_page.url
