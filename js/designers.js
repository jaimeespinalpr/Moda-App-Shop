const designersGrid = document.getElementById("designers-grid");
const quoteDesignerSelect = document.getElementById("quote-designer");

async function loadDesigners() {
  if (!supabaseClient || !designersGrid) return;

  const { data: designers } = await supabaseClient
    .from("designers")
    .select("*")
    .order("created_at", { ascending: false });

  if (!designers || designers.length === 0) return;

  const lang = document.documentElement.lang;
  const t = (translations && (translations[lang] || translations.es)) || {};
  const viewProfileLabel = t["profile.viewProfile"] || "Ver perfil →";

  designersGrid.innerHTML = "";
  designers.forEach((designer) => {
    const name = escapeHtml(designer.name);
    const specialty = escapeHtml(designer.specialty);
    const bio = escapeHtml(designer.bio);
    const initial = (designer.name || "?").trim().charAt(0).toUpperCase();

    const card = document.createElement("a");
    card.href = `designer-profile.html?id=${designer.id}`;
    card.className = "designer-card gig-card";
    card.innerHTML = `
      <div class="gig-card-media">
        ${designer.photo_url ? `<img src="${designer.photo_url}" alt="${name}" />` : ""}
      </div>
      <div class="gig-card-body">
        <div class="gig-card-header">
          <div class="gig-avatar">
            ${designer.photo_url ? `<img src="${designer.photo_url}" alt="" />` : escapeHtml(initial)}
          </div>
          <h3 class="gig-card-name">${name}</h3>
        </div>
        ${specialty ? `<span class="gig-specialty-badge">${specialty}</span>` : ""}
        ${bio ? `<p class="gig-card-bio">${bio}</p>` : ""}
        <span class="gig-card-cta">${viewProfileLabel}</span>
      </div>
    `;
    designersGrid.appendChild(card);
  });

  if (quoteDesignerSelect) {
    designers.forEach((designer) => {
      const option = document.createElement("option");
      option.value = designer.id;
      option.textContent = designer.name;
      quoteDesignerSelect.appendChild(option);
    });

    const preselectedId = new URLSearchParams(window.location.search).get("designer");
    if (preselectedId) {
      quoteDesignerSelect.value = preselectedId;
      const banner = document.getElementById("quote-target-banner");
      const selected = designers.find((d) => d.id === preselectedId);
      if (banner && selected) {
        banner.textContent = `${
          translations?.[document.documentElement.lang]?.["quote.targetPrefix"] || "Cotización dirigida a:"
        } ${selected.name}`;
        banner.style.display = "block";
      }
    }
  }
}

loadDesigners();
