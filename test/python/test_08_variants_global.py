"""
Test 8: Global Variants dashboard (new flow).

- /dashboard/variants loads with product filter button
- /dashboard/variants/new loads with product picker
- /dashboard/variants/<id> loads (when at least one variant exists)
- /dashboard/products has variants count linking to /dashboard/variants?productId=...
"""
import re


class TestVariantsGlobal:
    def test_variants_index_loads(self, admin_page):
        admin_page.goto("/dashboard/variants")
        admin_page.wait_for_load_state("networkidle")
        # H1 "Variantes"
        h1 = admin_page.locator("h1:has-text('Variantes')")
        assert h1.is_visible()
        # "Nueva variante" button
        new_btn = admin_page.locator(
            "a[href*='/dashboard/variants/new']:has-text('Nueva variante')"
        )
        assert new_btn.count() > 0
        # Product filter button (combobox trigger)
        product_filter = admin_page.locator(
            "button[role='combobox']:has-text('Filtrar producto')"
        )
        assert product_filter.count() > 0, "ProductPicker filter not visible"

    def test_variants_new_loads(self, admin_page):
        admin_page.goto("/dashboard/variants/new")
        admin_page.wait_for_load_state("networkidle")
        # H1 from PageHeader: contains "Nueva variante"
        page_text = admin_page.content()
        assert "Nueva variante" in page_text
        # Product picker button visible
        picker = admin_page.locator(
            "button[role='combobox']:has-text('Buscá y seleccioná un producto')"
        )
        assert picker.count() > 0
        # Without product, the editor is NOT shown — placeholder is
        assert "Seleccioná un producto arriba" in page_text

    def test_variants_filter_by_product_in_url(self, admin_page):
        # Pick a product id from the products listing
        admin_page.goto("/dashboard/products")
        admin_page.wait_for_load_state("networkidle")
        # The variants count cell links to /dashboard/variants?productId=
        link = admin_page.locator(
            "a[href*='/dashboard/variants?productId=']"
        ).first
        assert link.count() > 0, "No variants-count link found on products page"
        href = link.get_attribute("href")
        assert href and "productId=" in href
        m = re.search(r"productId=([0-9a-f-]+)", href)
        assert m, f"productId not found in href: {href}"
        product_id = m.group(1)

        # Visit it
        admin_page.goto(f"/dashboard/variants?productId={product_id}")
        admin_page.wait_for_load_state("networkidle")
        # Page rendered, and product filter shows the selected product (not the placeholder)
        # The trigger button should NOT contain "Filtrar producto" since a value is set.
        trigger = admin_page.locator("button[role='combobox']").first
        assert trigger.count() > 0
        trigger_text = trigger.inner_text()
        assert "Filtrar producto" not in trigger_text, (
            f"Expected product label, got placeholder: {trigger_text!r}"
        )

    def test_variant_edit_page_loads(self, admin_page):
        # Visit /dashboard/variants and grab the first edit link
        admin_page.goto("/dashboard/variants")
        admin_page.wait_for_load_state("networkidle")
        edit_link = admin_page.locator(
            "a[href^='/dashboard/variants/']:not([href$='/new'])"
        ).first
        if edit_link.count() == 0:
            # No variants in DB — skip
            import pytest
            pytest.skip("No variants in DB to edit")
        href = edit_link.get_attribute("href")
        assert href and re.match(r"^/dashboard/variants/[0-9a-f-]+$", href)
        admin_page.goto(href)
        admin_page.wait_for_load_state("networkidle")
        # The page header should mention "Editar variante"
        assert "Editar variante" in admin_page.content()
        # Should have the "Agregar atributo" button (modal-style attribute picker)
        assert "Agregar atributo" in admin_page.content()


class TestAttributeAssignmentInProductNew:
    def test_product_new_uses_modal_attribute_picker(self, admin_page):
        admin_page.goto("/dashboard/products/new")
        admin_page.wait_for_load_state("networkidle")
        # The new modal-style picker shows "Agregar atributo" button instead of
        # a static list of attribute selects.
        assert "Agregar atributo" in admin_page.content(), (
            "Attribute assignment modal trigger not found in /dashboard/products/new"
        )
