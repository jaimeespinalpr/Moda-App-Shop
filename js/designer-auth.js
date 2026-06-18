if (!supabaseClient) {
  const missing = document.getElementById("supabase-missing");
  const card = document.getElementById("auth-card");
  if (missing) missing.style.display = "block";
  if (card) card.style.display = "none";
} else {
  const tabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isLogin = tab.getAttribute("data-tab") === "login";
      loginForm.hidden = !isLogin;
      signupForm.hidden = isLogin;
    });
  });

  async function ensureDesignerRow(user) {
    const { data: existing } = await supabaseClient
      .from("designers")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabaseClient.from("designers").insert({
        id: user.id,
        name: user.user_metadata?.name || user.email,
        specialty: user.user_metadata?.specialty || "",
      });
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    await ensureDesignerRow(data.user);
    window.location.href = "designer-dashboard.html";
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("signup-error");
    const successEl = document.getElementById("signup-success");
    errorEl.textContent = "";
    successEl.textContent = "";

    const name = document.getElementById("signup-name").value;
    const specialty = document.getElementById("signup-specialty").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { name, specialty } },
    });

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    if (data.session) {
      await ensureDesignerRow(data.user);
      window.location.href = "designer-dashboard.html";
    } else {
      successEl.textContent =
        "¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.";
    }
  });

  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      ensureDesignerRow(session.user).then(() => {
        window.location.href = "designer-dashboard.html";
      });
    }
  });
}
