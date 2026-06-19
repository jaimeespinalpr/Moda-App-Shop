const quoteForm = document.getElementById("quote-form");
const quotePhotos = document.getElementById("quote-photos");
const quotePhotosPreview = document.getElementById("quote-photos-preview");

if (quotePhotos && quotePhotosPreview) {
  quotePhotos.addEventListener("change", () => {
    quotePhotosPreview.innerHTML = "";
    Array.from(quotePhotos.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = file.name;
        quotePhotosPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

async function uploadQuotePhoto(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabaseClient.storage.from("quote-photos").upload(path, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from("quote-photos").getPublicUrl(path);
  return data.publicUrl;
}

function showQuoteSuccess() {
  const successMsg = document.getElementById("quote-success");
  if (successMsg) {
    successMsg.style.display = "block";
    quoteForm.style.display = "none";
  }
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("quote-error");
    if (errorEl) errorEl.textContent = "";

    if (!supabaseClient) {
      showQuoteSuccess();
      return;
    }

    const email = document.getElementById("quote-email").value;
    const comments = document.getElementById("quote-comments").value;
    const designerId = document.getElementById("quote-designer")?.value || "";
    const materials = Array.from(
      quoteForm.querySelectorAll('input[name="materials"]:checked')
    ).map((el) => el.value);

    try {
      const photo_urls = await Promise.all(
        Array.from(quotePhotos?.files || []).map((file) => uploadQuotePhoto(file))
      );

      const { error } = await supabaseClient.from("quotes").insert({
        client_email: email,
        materials,
        comments,
        photo_urls,
        designer_ids: designerId ? [designerId] : [],
      });

      if (error) throw error;
      showQuoteSuccess();
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message;
    }
  });
}
