const designersGrid = document.getElementById("designers-grid");
const quoteDesignerSelect = document.getElementById("quote-designer");

async function loadDesigners() {
  if (!supabaseClient || !designersGrid) return;

  const { data: designers } = await supabaseClient
    .from("designers")
    .select("*")
    .order("created_at", { ascending: false });

  if (!designers || designers.length === 0) return;

  designersGrid.innerHTML = "";
  designers.forEach((designer) => {
    const card = document.createElement("a");
    card.href = `designer-profile.html?id=${designer.id}`;
    card.className = "designer-card";
    card.innerHTML = `
      ${
        designer.photo_url
          ? `<img src="${designer.photo_url}" alt="${designer.name}" class="designer-photo-img" />`
          : `<div class="designer-photo"></div>`
      }
      <h3>${designer.name}</h3>
      <p>${designer.specialty || ""}</p>
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
