function applyLanguage(lang) {
  const availableTranslations = typeof translations !== "undefined" ? translations : {};
  const targetLang = availableTranslations[lang] ? lang : "es";
  const dict = availableTranslations[targetLang] || {};

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
  });

  if (dict["page.title"]) {
    document.title = dict["page.title"];
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict["page.description"]) {
    metaDesc.setAttribute("content", dict["page.description"]);
  }

  document.documentElement.lang = targetLang;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === targetLang);
  });

  try {
    localStorage.setItem("wearquote-lang", targetLang);
  } catch (e) {
    console.warn("Could not save language preference to localStorage:", e);
  }
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyLanguage(btn.getAttribute("data-lang")));
});

let savedLang = null;
try {
  savedLang = localStorage.getItem("wearquote-lang");
} catch (e) {
  console.warn("Could not read language preference from localStorage:", e);
}

const browserLang = navigator.language?.startsWith("en") ? "en" : "es";
applyLanguage(savedLang || browserLang);

const quoteForm = document.getElementById("quote-form");
if (quoteForm) {
  quoteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const successMsg = document.getElementById("quote-success");
    if (successMsg) {
      successMsg.style.display = "block";
      quoteForm.style.display = "none";
    }
  });
}
