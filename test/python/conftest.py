"""
Shared fixtures for Playwright browser tests.
Requires: dev server running at http://localhost:3000
"""
import pytest
import tempfile
import os
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@interbras.com"
ADMIN_PASSWORD = "Admin@2024!Secure"


@pytest.fixture(scope="session")
def browser():
    """Launch a single browser instance for the entire test session."""
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture(scope="session")
def admin_storage_state(browser: Browser):
    """
    Login once as admin and save storage state (cookies/localStorage).
    Reused by all admin_page fixtures to avoid hitting rate limits.
    """
    ctx = browser.new_context(base_url=BASE_URL)
    ctx.set_default_timeout(15_000)
    p = ctx.new_page()

    p.goto("/login")
    p.fill('input[name="email"]', ADMIN_EMAIL)
    p.fill('input[name="password"]', ADMIN_PASSWORD)
    p.click('button[type="submit"]:has-text("Entrar")')
    p.wait_for_url(lambda url: "/login" not in url, timeout=15_000)

    state_file = os.path.join(tempfile.gettempdir(), "admin_state.json")
    ctx.storage_state(path=state_file)
    p.close()
    ctx.close()
    yield state_file
    os.unlink(state_file) if os.path.exists(state_file) else None


@pytest.fixture()
def context(browser: Browser):
    """Fresh browser context (clean cookies/storage) per test."""
    ctx = browser.new_context(base_url=BASE_URL)
    ctx.set_default_timeout(15_000)
    yield ctx
    ctx.close()


@pytest.fixture()
def page(context: BrowserContext):
    """Fresh page per test."""
    p = context.new_page()
    yield p
    p.close()


@pytest.fixture()
def admin_page(browser: Browser, admin_storage_state: str):
    """
    Page with admin session pre-loaded from stored state.
    No extra login needed — avoids rate limit issues.
    """
    ctx = browser.new_context(
        base_url=BASE_URL,
        storage_state=admin_storage_state,
    )
    ctx.set_default_timeout(15_000)
    p = ctx.new_page()
    yield p
    p.close()
    ctx.close()
