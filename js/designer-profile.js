if (!supabaseClient) {
  const missing = document.getElementById("supabase-missing");
  if (missing) missing.style.display = "block";
} else {
  const designerId = new URLSearchParams(window.location.search).get("id");

  async function loadDesignerProfile() {
    if (!designerId) {
      document.getElementById("profile-not-found").style.display = "block";
      return;
    }

    const { data: designer } = await supabaseClient
      .from("designers")
      .select("*")
      .eq("id", designerId)
      .maybeSingle();

    if (!designer) {
      document.getElementById("profile-not-found").style.display = "block";
      return;
    }

    document.getElementById("profile-name").textContent = designer.name;
    document.getElementById("profile-specialty").textContent = designer.specialty || "";
    document.getElementById("profile-bio").textContent = designer.bio || "";
    document.getElementById("profile-quote-link").href = `index.html?designer=${designer.id}#quote`;

    const photo = document.getElementById("profile-photo");
    if (designer.photo_url) {
      photo.src = designer.photo_url;
    }

    const { data: items } = await supabaseClient
      .from("portfolio_items")
      .select("*")
      .eq("designer_id", designerId)
      .order("created_at", { ascending: false });

    const grid = document.getElementById("profile-portfolio-grid");
    grid.innerHTML = "";
    (items || []).forEach((item) => {
      const card = document.createElement("div");
      card.className = "designer-card";
      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title || ""}" class="portfolio-thumb" />
        <h3>${item.title || ""}</h3>
        <p>${item.description || ""}</p>
      `;
      grid.appendChild(card);
    });

    document.getElementById("profile-content").style.display = "block";
  }

  loadDesignerProfile();
}
