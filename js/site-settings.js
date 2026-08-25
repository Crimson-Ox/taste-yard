/* =========================================================
   SITE SETTINGS
   Loads restaurant_settings and applies it to any page
   that has [data-site="..."] elements. Pages with no
   matching elements simply keep their static HTML text —
   that's the built-in fallback if this fails to load.
   ========================================================= */

let siteSettings = null;

async function loadSiteSettings() {
    const { data, error } = await supabaseClient
        .from("restaurant_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error || !data) {
        console.error("Could not load site settings — page defaults will remain visible.", error);
        return;
    }

    siteSettings = data;
    applySiteSettings(data);
}

function applySiteSettings(data) {
    setText('[data-site="name"]', data.restaurant_name);
    setText('[data-site="description"]', data.description);
    setText('[data-site="phone"]', data.phone_number);
    setText('[data-site="address"]', data.address);
    setText('[data-site="hours"]', data.opening_hours);
    setText('[data-site="delivery-info"]', data.delivery_information);

    if (data.location_url) {
        document.querySelectorAll('[data-site="location-url"]').forEach(el => {
            el.href = data.location_url;
        });
    }

    if (data.restaurant_name) {
        document.title = document.title.replace(/Taste Yard( by Millennium)?/i, data.restaurant_name);
    }

    if (data.whatsapp_number) {
        window.SITE_WHATSAPP_NUMBER = data.whatsapp_number;
    }

    const badge = document.querySelector('[data-site="status-badge"]');
    if (badge) {
        badge.textContent = data.is_open
            ? "🟢 Open — Orders are currently being accepted."
            : "🔴 Closed — We're currently closed.";
        badge.classList.toggle("status-open", data.is_open);
        badge.classList.toggle("status-closed", !data.is_open);
    }

    if (!data.is_open) {
        enforceClosedState();
    }
}

function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => {
        el.textContent = value;
    });
}

function enforceClosedState() {
    document.querySelectorAll(".add-btn").forEach(btn => {
        btn.disabled = true;
        btn.textContent = "Closed";
    });

    const submitBtn = document.querySelector('#orderForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "We're currently closed";
    }

    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
        orderForm.addEventListener("submit", event => {
            event.preventDefault();
            alert("Sorry, we're currently closed and not accepting orders right now.");
        });
    }
}

document.addEventListener("DOMContentLoaded", loadSiteSettings);