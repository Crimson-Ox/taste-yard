/* =========================================================
   ADMIN AUTH
   Handles login, logout, and page-guarding for admin pages
   ========================================================= */

async function isCurrentUserAdmin() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        return false;
    }

    return !!data;
}

async function handleLogin(event) {
    event.preventDefault();

    const errorEl = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    errorEl.hidden = true;
    btn.disabled = true;
    btn.textContent = "Signing in…";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorEl.textContent = "Incorrect email or password.";
        errorEl.hidden = false;
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
    }

    const admin = await isCurrentUserAdmin();

    if (!admin) {
        await supabaseClient.auth.signOut();
        errorEl.textContent = "This account does not have admin access.";
        errorEl.hidden = false;
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
    }

    window.location.href = "admin.html";
}

/* Call this at the top of every protected admin page */
async function protectAdminPage() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "admin-login.html";
        return;
    }

    const admin = await isCurrentUserAdmin();

    if (!admin) {
        await supabaseClient.auth.signOut();
        window.location.href = "admin-login.html";
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = "admin-login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }
});