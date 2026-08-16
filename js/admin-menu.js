/* =========================================================
   ADMIN MENU MANAGEMENT
   ========================================================= */

let adminItems = [];

async function loadAdminMenu() {
    const container = document.getElementById("adminMenuList");
    const summary = document.getElementById("menuSummary");

    const { data, error } = await supabaseClient
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        container.innerHTML = `<p class="menu-error">Couldn't load the menu. ${error.message}</p>`;
        return;
    }

    adminItems = data || [];
    renderAdminList();
}

function renderAdminList() {
    const container = document.getElementById("adminMenuList");
    const summary = document.getElementById("menuSummary");

    const total = adminItems.length;
    const available = adminItems.filter(i => i.status === "available").length;
    const limited = adminItems.filter(i => i.status === "limited").length;
    const soldOut = adminItems.filter(i => i.status === "sold_out").length;

    summary.textContent = `${total} items · ${available} available · ${limited} limited · ${soldOut} sold out`;

    if (total === 0) {
        container.innerHTML = `<p class="menu-error">No items yet. Click "Add New Food" to start.</p>`;
        return;
    }

    container.innerHTML = adminItems.map(item => `
        <div class="admin-row">
            <div class="admin-row-main">
                <strong>${escapeHTML(item.name)}</strong>
                <span class="admin-row-meta">${escapeHTML(item.category)} &middot; ${formatNaira(item.price)}</span>
            </div>

            <select class="status-select" data-id="${item.id}" onchange="quickChangeStatus(this)">
                <option value="available" ${item.status === "available" ? "selected" : ""}>🟢 Available</option>
                <option value="limited" ${item.status === "limited" ? "selected" : ""}>🟡 Limited</option>
                <option value="sold_out" ${item.status === "sold_out" ? "selected" : ""}>🔴 Sold Out</option>
                <option value="unavailable" ${item.status === "unavailable" ? "selected" : ""}>⚪ Unavailable</option>
            </select>

            <div class="admin-row-actions">
                <button class="btn btn-outline btn-small" onclick="openEditForm('${item.id}')">Edit</button>
                <button class="btn btn-outline btn-small btn-danger" onclick="deleteItem('${item.id}', '${escapeJS(item.name)}')">Delete</button>
            </div>
        </div>
    `).join("");
}

async function quickChangeStatus(selectEl) {
    const id = selectEl.dataset.id;
    const newStatus = selectEl.value;

    const { error } = await supabaseClient
        .from("menu_items")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        alert("Couldn't update status: " + error.message);
        return;
    }

    const item = adminItems.find(i => i.id === id);
    if (item) item.status = newStatus;
    renderAdminList();
}

function openAddForm() {
    document.getElementById("formTitle").textContent = "Add New Food";
    document.getElementById("itemForm").reset();
    document.getElementById("itemId").value = "";
    document.getElementById("itemStatus").value = "available";
    document.getElementById("itemSortOrder").value = "0";
    document.getElementById("formError").hidden = true;
    document.getElementById("formOverlay").hidden = false;
}

function openEditForm(id) {
    const item = adminItems.find(i => i.id === id);
    if (!item) return;

    document.getElementById("formTitle").textContent = "Edit Food";
    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDescription").value = item.description || "";
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemImage").value = item.image_url || "";
    document.getElementById("itemStatus").value = item.status;
    document.getElementById("itemSortOrder").value = item.sort_order;
    document.getElementById("formError").hidden = true;
    document.getElementById("formOverlay").hidden = false;
}

function closeForm() {
    document.getElementById("formOverlay").hidden = true;
}

async function saveItem(event) {
    event.preventDefault();

    const errorEl = document.getElementById("formError");
    const saveBtn = document.getElementById("saveBtn");

    const id = document.getElementById("itemId").value;
    const payload = {
        name: document.getElementById("itemName").value.trim(),
        description: document.getElementById("itemDescription").value.trim(),
        price: Number(document.getElementById("itemPrice").value),
        category: document.getElementById("itemCategory").value.trim(),
        image_url: document.getElementById("itemImage").value.trim() || null,
        status: document.getElementById("itemStatus").value,
        sort_order: Number(document.getElementById("itemSortOrder").value) || 0,
        updated_at: new Date().toISOString()
    };

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    let error;

    if (id) {
        ({ error } = await supabaseClient.from("menu_items").update(payload).eq("id", id));
    } else {
        ({ error } = await supabaseClient.from("menu_items").insert(payload));
    }

    saveBtn.disabled = false;
    saveBtn.textContent = "Save";

    if (error) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
        return;
    }

    closeForm();
    loadAdminMenu();
}

async function deleteItem(id, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    const { error } = await supabaseClient.from("menu_items").delete().eq("id", id);

    if (error) {
        alert("Couldn't delete: " + error.message);
        return;
    }

    loadAdminMenu();
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("adminMenuList")) return;

    loadAdminMenu();

    document.getElementById("addNewBtn").addEventListener("click", openAddForm);
    document.getElementById("closeFormBtn").addEventListener("click", closeForm);
    document.getElementById("cancelFormBtn").addEventListener("click", closeForm);
    document.getElementById("itemForm").addEventListener("submit", saveItem);
});