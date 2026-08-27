/* =========================================================
   TASTE YARD
   Main JavaScript
   ========================================================= */
/* =========================================================
   CONFIGURATION
   ========================================================= */
/*
   IMPORTANT:
   Replace this with the restaurant's real WhatsApp number.
   Format:
   Country code + number
   WITHOUT +
   WITHOUT spaces
   WITHOUT brackets
   Example:
   2348012345678
*/
const RESTAURANT_WHATSAPP = "23400000000000";
/* =========================================================
   CART
   ========================================================= */
let cart = JSON.parse(localStorage.getItem("tasteYardCart")) || [];
function saveCart() {
    localStorage.setItem(
        "tasteYardCart",
        JSON.stringify(cart)
    );
}
function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(amount);
}
/* =========================================================
   CART COUNT
   ========================================================= */
function updateCartCount() {
    const countElements =
        document.querySelectorAll(".cart-count");
    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
    countElements.forEach(element => {
        element.textContent = totalItems;
    });
}
/* =========================================================
   ADD ITEM
   ========================================================= */
function addToCart(button) {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    const image = button.dataset.image || "";
    const existingItem = cart.find(
        item => item.name === name
    );
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name,
            price,
            image,
            quantity: 1
        });
    }
    saveCart();
    updateCartCount();
    /* Small feedback animation */
    const originalText = button.innerHTML;
    button.innerHTML = "Added ✓";
    button.classList.add("added");
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove("added");
    }, 900);
}
/* =========================================================
   REMOVE ITEM
   ========================================================= */
function removeFromCart(name) {
    cart = cart.filter(
        item => item.name !== name
    );
    saveCart();
    renderCart();
    updateCartCount();
}
/* =========================================================
   CHANGE QUANTITY
   ========================================================= */
function changeQuantity(name, change) {
    const item = cart.find(
        item => item.name === name
    );
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(
            cartItem => cartItem.name !== name
        );
    }
    saveCart();
    renderCart();
    updateCartCount();
}
/* =========================================================
   CART TOTAL
   ========================================================= */
function getCartTotal() {
    return cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );
}
/* =========================================================
   RENDER ORDER CART
   ========================================================= */
function renderCart() {
    const cartContainer =
        document.getElementById("cartItems");
    if (!cartContainer) return;
    const totalElement =
        document.getElementById("cartTotal");
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    🧾
                </div>
                <h3>
                    Your ticket is empty.
                </h3>
                <p>
                    You haven't added anything yet.
                </p>
                <a
                    href="menu.html"
                    class="btn btn-primary"
                >
                    Browse Menu →
                </a>
            </div>
        `;
        if (totalElement) {
            totalElement.textContent = "₦0";
        }
        return;
    }
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal =
            item.price * item.quantity;
        return `
            <div class="ticket-item">
                <div class="ticket-item-main">
                    <div>
                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>
                        <span>
                            ${formatNaira(item.price)}
                            × ${item.quantity}
                        </span>
                    </div>
                    <strong>
                        ${formatNaira(itemTotal)}
                    </strong>
                </div>
                <div class="quantity-controls">
                    <button
                        type="button"
                        onclick="changeQuantity('${escapeJS(item.name)}', -1)"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>
                    <span>
                        ${item.quantity}
                    </span>
                    <button
                        type="button"
                        onclick="changeQuantity('${escapeJS(item.name)}', 1)"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        class="remove-item"
                        onclick="removeFromCart('${escapeJS(item.name)}')"
                    >
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join("");
    if (totalElement) {
        totalElement.textContent =
            formatNaira(getCartTotal());
    }
}
/* =========================================================
   ESCAPE HELPERS
   ========================================================= */
function escapeHTML(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function escapeJS(value) {
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}
/* =========================================================
   WHATSAPP ORDER
   ========================================================= */
async function sendOrderViaWhatsApp(event) {
    event.preventDefault();
    const warning =
        document.getElementById("orderWarning");
    if (cart.length === 0) {
        if (warning) {
            warning.hidden = false;
            warning.textContent =
                "Your cart is empty. Add something delicious first.";
        }
        return;
    }
    if (warning) {
        warning.hidden = true;
    }
    const form =
        document.getElementById("orderForm");
    const formData =
        new FormData(form);
    const name =
        formData.get("name").trim();
    const phone =
        formData.get("phone").trim();
    const fulfilment =
        formData.get("fulfilment");
    const address =
        formData.get("address").trim();
    if (
        fulfilment === "Delivery" &&
        !address
    ) {
        document
            .getElementById("address")
            .focus();
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order…";

    let orderNumber = "----";

    try {
        const { data, error } = await supabaseClient.rpc("place_order", {
            p_customer_name: name,
            p_customer_phone: phone,
            p_fulfilment_type: fulfilment.toLowerCase(),
            p_delivery_address: fulfilment === "Delivery" ? address : null,
            p_total: getCartTotal(),
            p_items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        });

        if (error) {
            console.error("Order could not be saved:", error);
        } else if (data && data[0]) {
            orderNumber = data[0].order_number;
            const orderNumberEl = document.getElementById("orderNumber");
            if (orderNumberEl) orderNumberEl.textContent = orderNumber;
        }
    } catch (err) {
        console.error("Order could not be saved:", err);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;

        let message = "";
    message += `🔥 *TASTE YARD ORDER*\n`;
    message += `Order #: ${orderNumber}\n`;
    message += `------------------------------\n\n`;
    message += `*CUSTOMER*\n`;
    message += `Name: ${name}\n`;
    message += `Phone: ${phone}\n`;
    message += `Fulfilment: ${fulfilment}\n`;
    if (fulfilment === "Delivery") {
        message += `Address: ${address}\n`;
    }
    message += `\n*ORDER*\n`;
    cart.forEach(item => {
        const itemTotal =
            item.price * item.quantity;
        message +=
            `${item.quantity} × ${item.name} — ${formatNaira(itemTotal)}\n`;
    });
    message += `\n------------------------------\n`;
    message += `*TOTAL: ${formatNaira(getCartTotal())}*\n`;
    message += `------------------------------\n\n`;
    message += `Sent from the Taste Yard website.`;
    const encodedMessage =
        encodeURIComponent(message);
    const whatsappNumber = window.SITE_WHATSAPP_NUMBER || RESTAURANT_WHATSAPP;
    const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(
        whatsappURL,
        "_blank"
    );
}
/* =========================================================
   ORDER NUMBER
   ========================================================= */

    const element =
        document.getElementById("orderNumber");
   

/* =========================================================
   DELIVERY / PICKUP
   ========================================================= */
function setupFulfilment() {
    const radios =
        document.querySelectorAll(
            'input[name="fulfilment"]'
        );
    const addressGroup =
        document.getElementById("addressGroup");
    const address =
        document.getElementById("address");
    if (!radios.length || !addressGroup) {
        return;
    }
    radios.forEach(radio => {
        radio.addEventListener(
            "change",
            () => {
                if (
                    radio.checked &&
                    radio.value === "Delivery"
                ) {
                    addressGroup.hidden = false;
                    if (address) {
                        address.required = true;
                    }
                } else if (
                    radio.checked &&
                    radio.value === "Pickup"
                ) {
                    addressGroup.hidden = true;
                    if (address) {
                        address.required = false;
                        address.value = "";
                    }
                }
            }
        );
    });
}
/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */
function setupMobileNavigation() {
    const toggle =
        document.querySelector(".menu-toggle");
    const nav =
        document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener(
        "click",
        () => {
            nav.classList.toggle("open");
        }
    );
    nav.querySelectorAll("a")
        .forEach(link => {
            link.addEventListener(
                "click",
                () => {
                    nav.classList.remove("open");
                }
            );
        });
}
/* =========================================================
   ADD BUTTONS
   ========================================================= */
function setupAddButtons() {
    document
        .querySelectorAll(".add-btn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => addToCart(button)
            );
        });
}
/* =========================================================
   INITIALIZE
   ========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateCartCount();
        setupAddButtons();
        renderCart();
        setupFulfilment();
        setupMobileNavigation();
        const orderForm =
            document.getElementById("orderForm");
        if (orderForm) {
            orderForm.addEventListener(
                "submit",
                sendOrderViaWhatsApp
            );
        }
    }
);
