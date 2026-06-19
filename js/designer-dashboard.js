if (!supabaseClient) {
  const missing = document.getElementById("supabase-missing");
  const content = document.getElementById("dashboard-content");
  if (missing) missing.style.display = "block";
  if (content) content.style.display = "none";
} else {
  let currentUser = null;

  const profileForm = document.getElementById("profile-form");
  const portfolioForm = document.getElementById("portfolio-upload-form");
  const portfolioGrid = document.getElementById("portfolio-grid");
  const logoutBtn = document.getElementById("logout-btn");

  function uploadPath(userId, file) {
    const ext = file.name.split(".").pop();
    return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  }

  async function uploadImage(bucket, userId, file) {
    const path = uploadPath(userId, file);
    const { error } = await supabaseClient.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadProfile() {
    const { data: designer } = await supabaseClient
      .from("designers")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (designer) {
      document.getElementById("profile-name").value = designer.name || "";
      document.getElementById("profile-specialty").value = designer.specialty || "";
      document.getElementById("profile-bio").value = designer.bio || "";
      const preview = document.getElementById("profile-photo-preview");
      if (designer.photo_url) {
        preview.src = designer.photo_url;
        preview.style.display = "block";
      }
    }
  }

  async function loadPortfolio() {
    const { data: items } = await supabaseClient
      .from("portfolio_items")
      .select("*")
      .eq("designer_id", currentUser.id)
      .order("created_at", { ascending: false });

    portfolioGrid.innerHTML = "";
    (items || []).forEach((item) => {
      const title = escapeHtml(item.title);
      const description = escapeHtml(item.description);
      const card = document.createElement("div");
      card.className = "designer-card";
      card.innerHTML = `
        <img src="${item.image_url}" alt="${title}" class="portfolio-thumb" />
        <h3>${title}</h3>
        <p>${description}</p>
        <button class="btn btn-secondary delete-portfolio-item" data-id="${item.id}">Eliminar</button>
      `;
      portfolioGrid.appendChild(card);
    });

    portfolioGrid.querySelectorAll(".delete-portfolio-item").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await supabaseClient.from("portfolio_items").delete().eq("id", btn.getAttribute("data-id"));
        loadPortfolio();
      });
    });
  }

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById("profile-status");
    statusEl.textContent = "";

    const name = document.getElementById("profile-name").value;
    const specialty = document.getElementById("profile-specialty").value;
    const bio = document.getElementById("profile-bio").value;
    const photoInput = document.getElementById("profile-photo");

    let photo_url;
    if (photoInput.files[0]) {
      photo_url = await uploadImage("portfolio", currentUser.id, photoInput.files[0]);
    }

    const update = { name, specialty, bio };
    if (photo_url) update.photo_url = photo_url;

    await supabaseClient.from("designers").update(update).eq("id", currentUser.id);
    statusEl.textContent = "Perfil guardado.";
    loadProfile();
  });

  portfolioForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("portfolio-error");
    errorEl.textContent = "";

    const imageInput = document.getElementById("portfolio-image");
    const title = document.getElementById("portfolio-title").value;
    const description = document.getElementById("portfolio-description").value;

    if (!imageInput.files[0]) return;

    try {
      const image_url = await uploadImage("portfolio", currentUser.id, imageInput.files[0]);
      await supabaseClient.from("portfolio_items").insert({
        designer_id: currentUser.id,
        image_url,
        title,
        description,
      });
      portfolioForm.reset();
      loadPortfolio();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "designer-login.html";
  });

  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      window.location.href = "designer-login.html";
      return;
    }
    currentUser = session.user;
    loadProfile();
    loadPortfolio();
  });
}
