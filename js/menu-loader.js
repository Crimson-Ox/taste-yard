async function loadMenu() {
    const container = document.getElementById("menu-dynamic");
    if (!container) return;

    const { data: items, error } = await supabaseClient
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        container.innerHTML = `<p class="menu-error">Couldn't load the menu right now. Please refresh.</p>`;
        console.error(error);
        return;
    }

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="menu-error">No items on the menu yet.</p>`;
        return;
    }

    const categories = [];
    const grouped = {};

    items.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
            categories.push(item.category);
        }
        grouped[item.category].push(item);
    });

    container.innerHTML = categories.map((category, index) => {
        const num = String(index + 1).padStart(2, "0");
        return `
            <div class="menu-category">
                <div class="category-heading">
                    <div>
                        <span class="eyebrow">${num} / ${category.toUpperCase()}</span>
                        <h2>${category}</h2>
                    </div>
                </div>
                <div class="menu-grid">
                    ${grouped[category].map(renderCard).join("")}
                </div>
            </div>
        `;
    }).join("");

    setupAddButtons();
}

function renderCard(item) {
    const isOrderable = item.status === "available" || item.status === "limited";

    const statusBadge = {
        limited: `<span class="status-badge status-limited">Limited</span>`,
        sold_out: `<span class="status-badge status-sold-out">Sold Out</span>`,
        unavailable: `<span class="status-badge status-unavailable">Unavailable</span>`
    }[item.status] || "";

    const imageBlock = item.image_url
        ? `<img src="${item.image_url}" alt="${escapeHTML(item.name)}">`
        : `<div class="menu-card-placeholder">🍽️</div>`;

    const buttonBlock = isOrderable
        ? `<button class="add-btn" data-name="${escapeHTML(item.name)}" data-price="${item.price}" data-image="${item.image_url || ""}">Add to Cart +</button>`
        : `<button class="add-btn" disabled>${item.status === "sold_out" ? "Sold Out" : "Unavailable"}</button>`;

    return `
        <article class="menu-card">
            ${imageBlock}
            <div class="menu-card-content">
                <div class="menu-name-price">
                    <h3>${escapeHTML(item.name)} ${statusBadge}</h3>
                    <strong>${formatNaira(item.price)}</strong>
                </div>
                <p>${escapeHTML(item.description || "")}</p>
                ${buttonBlock}
            </div>
        </article>
    `;
}

document.addEventListener("DOMContentLoaded", loadMenu);