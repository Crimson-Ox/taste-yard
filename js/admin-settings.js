async function loadSettingsForm() {
    const { data, error } = await supabaseClient
        .from("restaurant_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error || !data) {
        document.getElementById("formError").textContent = "Couldn't load current settings.";
        document.getElementById("formError").hidden = false;
        return;
    }

    document.getElementById("s-name").value = data.restaurant_name || "";
    document.getElementById("s-description").value = data.description || "";
    document.getElementById("s-whatsapp").value = data.whatsapp_number || "";
    document.getElementById("s-phone").value = data.phone_number || "";
    document.getElementById("s-address").value = data.address || "";
    document.getElementById("s-location").value = data.location_url || "";
    document.getElementById("s-hours").value = data.opening_hours || "";
    document.getElementById("s-delivery").value = data.delivery_information || "";

    const statusRadio = document.querySelector(`input[name="s-status"][value="${data.is_open ? "open" : "closed"}"]`);
    if (statusRadio) statusRadio.checked = true;
}

async function saveSettings(event) {
    event.preventDefault();

    const errorEl = document.getElementById("formError");
    const successEl = document.getElementById("formSuccess");
    const saveBtn = document.getElementById("saveBtn");

    errorEl.hidden = true;
    successEl.hidden = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    const payload = {
        restaurant_name: document.getElementById("s-name").value.trim(),
        description: document.getElementById("s-description").value.trim(),
        whatsapp_number: document.getElementById("s-whatsapp").value.trim(),
        phone_number: document.getElementById("s-phone").value.trim(),
        address: document.getElementById("s-address").value.trim(),
        location_url: document.getElementById("s-location").value.trim(),
        opening_hours: document.getElementById("s-hours").value.trim(),
        delivery_information: document.getElementById("s-delivery").value.trim(),
        is_open: document.querySelector('input[name="s-status"]:checked').value === "open",
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from("restaurant_settings")
        .update(payload)
        .eq("id", 1);

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";

    if (error) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
        return;
    }

    successEl.textContent = "Saved — the live site is now updated.";
    successEl.hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("settingsForm")) return;
    loadSettingsForm();
    document.getElementById("settingsForm").addEventListener("submit", saveSettings);
});