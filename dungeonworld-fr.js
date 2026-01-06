// =========================
// DungeonWorld-FR (module) - main script (perf v13+)
// =========================

// Initialisation Babele
Hooks.once("babele.init", () => {
  if (!game.babele) return;
  game.babele.register({
    module: "dungeonworld-fr",
    lang: "fr",
    dir: "compendium",
  });
});

// Préfixe de log
const DW_PREFIX = "DW-fr |";
const log = (...a) => console.log(DW_PREFIX, ...a);
const warn = (...a) => console.warn(DW_PREFIX, ...a);
const error = (...a) => console.error(DW_PREFIX, ...a);

// Confirmation de chargement
Hooks.once("ready", () => log("Module DungeonWorld-FR chargé avec succès ✔️"));

// =========================
// FilePicker v13+ + CACHE (perf)
// =========================
function getFilePickerImpl() {
  return foundry?.applications?.apps?.FilePicker?.implementation ?? null;
}

/**
 * Cache des listings par dossier (source+path)
 * -> évite de faire 20 browse() par token quand on cherche les variantes
 */
const DIR_CACHE = new Map(); // key => { ts, files:Set<string> }
const DIR_CACHE_TTL = 60_000; // 60s (ajuste si tu veux)

/** Normalise les chemins pour comparaison */
function normPath(p) {
  return (p ?? "").replace(/\\/g, "/");
}

/**
 * Liste (et met en cache) les fichiers d’un dossier.
 * Retourne Set(files) ou null si non browsable.
 */
async function getDirFilesSet(basePath, source = "data") {
  basePath = normPath(basePath);
  const key = `${source}:${basePath}`;
  const now = Date.now();

  const cached = DIR_CACHE.get(key);
  if (cached && now - cached.ts < DIR_CACHE_TTL) return cached.files;

  try {
    const FilePickerImpl = getFilePickerImpl();
    if (!FilePickerImpl) return null;

    // Certains chemins (core/icons) peuvent ne pas être browsables via "data"
    const res = await FilePickerImpl.browse(source, basePath);
    const set = new Set((res?.files ?? []).map(normPath));

    DIR_CACHE.set(key, { ts: now, files: set });
    return set;
  } catch {
    // Pas browsable -> on ne spam pas, on cache un "null" temporaire
    DIR_CACHE.set(key, { ts: now, files: null });
    return null;
  }
}

/** Vérifie existence d’un fichier en 1 browse() max par dossier */
async function fileExistsFast(filePath, source = "data") {
  filePath = normPath(filePath);
  const basePath = filePath.split("/").slice(0, -1).join("/");
  const set = await getDirFilesSet(basePath, source);
  if (!set) return false;
  return set.has(filePath);
}

// =========================
// Settings
// =========================
Hooks.once("init", () => {
  const MODULE_ID = "dungeonworld-fr";

  game.settings.register(MODULE_ID, "useAIContent", {
    name: game.i18n.localize("DW-FR.Settings.useAdditionalContentName"),
    hint: game.i18n.localize("DW-FR.Settings.useAdditionalContentHint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
    onChange: (value) => {
      ui.notifications.info(
        value
          ? "Contenu IA activé — rechargement requis."
          : "Contenu IA désactivé — rechargement requis."
      );
    },
  });
});

// =========================
// Gestion automatique des images de tokens (perf)
// =========================
const TOKEN_VARIANTS = [
  "-token", "_token", "token", "(token)", "[token]",
  "%20-%20token", "%20_%20token", "%20token", "%20(token)", "%20[token]",
  "-Token", "_Token", "Token", "(Token)", "[Token]",
  "%20-%20Token", "%20_%20Token", "%20Token", "%20(Token)", "%20[Token]"
];

function generateTokenCandidatePaths(actorImgPath) {
  actorImgPath = normPath(actorImgPath);

  // Si c’est une URL ou un chemin sans extension, on ne cherche pas
  if (!actorImgPath || /^https?:\/\//i.test(actorImgPath)) return [];

  const parts = actorImgPath.split("/");
  const last = parts.pop() ?? "";
  const dot = last.lastIndexOf(".");
  if (dot <= 0) return [];

  const name = last.slice(0, dot);
  const ext = last.slice(dot + 1);
  const basePath = parts.join("/");

  return TOKEN_VARIANTS.map(v => `${basePath}/${name}${v}.${ext}`);
}

/**
 * Retourne l’image token la plus adaptée (*-token si existe) sinon l’image d’origine.
 * Perf: 1 browse() max sur le dossier.
 */
async function getTokenImagePath(actorImgPath) {
  actorImgPath = normPath(actorImgPath);
  const candidates = generateTokenCandidatePaths(actorImgPath);
  if (!candidates.length) return actorImgPath;

  const basePath = candidates[0].split("/").slice(0, -1).join("/");
  const set = await getDirFilesSet(basePath, "data");
  if (!set) return actorImgPath;

  // On retourne la première variante trouvée
  for (const c of candidates) {
    if (set.has(normPath(c))) return c;
  }
  return actorImgPath;
}

Hooks.on("updateActor", async (actor, data) => {
  if (!data.img) return;
  try {
    const tokenImg = await getTokenImagePath(data.img);

    // Evite updates inutiles
    const currentProto = actor.prototypeToken?.texture?.src;
    if (currentProto !== tokenImg) {
      await actor.prototypeToken.update({ "texture.src": tokenImg });
    }

    const active = actor.getActiveTokens(true);
    if (active?.length) {
      await Promise.all(
        active.map(t => t.document.update({ "texture.src": tokenImg }))
      );
    }
  } catch (e) {
    error("Erreur dans le hook updateActor:", e);
  }
});

Hooks.on("createToken", async (tokenDoc) => {
  try {
    let originalSrc = normPath(tokenDoc.texture?.src);
    const actorImg = normPath(tokenDoc.actor?.img);

    // 1) Fallback si token vide / placeholder
    if (!originalSrc || originalSrc.includes("icons/svg/mystery-man.svg")) {
      if (actorImg) {
        log(`Token sans image, fallback sur actor.img: ${actorImg}`);
        originalSrc = actorImg;
      } else {
        warn("Aucun actor.img trouvé, on garde l’image par défaut.");
        return;
      }
    }

    // 2) Vérifie existence réelle (perf: cache dossier)
    // Si c’est un chemin core (icons/), il peut ne pas être browsable via data -> on skip sans spam
    const looksLikeDataFile =
      originalSrc.startsWith("modules/") ||
      originalSrc.startsWith("worlds/") ||
      originalSrc.startsWith("systems/") ||
      originalSrc.startsWith("uploads/") ||
      originalSrc.startsWith("assets/");

    if (looksLikeDataFile) {
      const exists = await fileExistsFast(originalSrc, "data");
      if (!exists) {
        warn(`Image introuvable: ${originalSrc}`);
        if (actorImg && actorImg !== originalSrc) {
          log(`Remplacement par actor.img: ${actorImg}`);
          originalSrc = actorImg;
        } else {
          warn("Utilisation du placeholder par défaut.");
          originalSrc = "icons/svg/mystery-man.svg";
        }
      }
    }

    // 3) Cherche la version *-token si elle existe (perf: 1 browse())
    const tokenImg = await getTokenImagePath(originalSrc);

    // 4) Applique si différence
    const current = normPath(tokenDoc.texture?.src);
    if (tokenImg && tokenImg !== current) {
      await tokenDoc.update({ "texture.src": tokenImg });
      log(`Texture corrigée juste après création → ${tokenImg}`);
    }
  } catch (e) {
    error("Erreur createToken:", e);
  }
});

// =========================
// Section personnalisée dans les paramètres
// =========================
Hooks.on("renderSettings", (app, html) => {
  try {
    const root = html?.[0] ?? html;
    const header = root?.querySelector?.("h4.divider");
    if (!header) return error("Aucun <h4.divider> trouvé dans les paramètres");

    const defaultLogos = { light: "logo.svg", dark: "logo-dark.svg" };

    const getTheme = () =>
      root.classList.contains("theme-dark")
        ? "dark"
        : root.classList.contains("theme-light")
        ? "light"
        : game.settings.get("core", "uiConfig")?.colorScheme?.interface ?? "light";

    const getLogoPath = () => {
      const theme = getTheme();
      return `modules/dungeonworld-fr/assets/${defaultLogos[theme] || defaultLogos.light}`;
    };

    const section = document.createElement("section");
    section.classList.add("settings", "flexcol");
    section.innerHTML = `
      <h4 class="divider">${game.i18n.localize("DW-FR.Links.Title")}</h4>
      <div class="system-badge">
        <img class="mh-dynamic-logo" src="${getLogoPath()}">
      </div>
    `;

    const links = [
      { icon: "fa-solid fa-cart-shopping", key: "Shop" },
      { icon: "fab fa-github", key: "Git" },
      { icon: "fa-regular fa-mug-hot fa-bounce", key: "Donation" },
    ];

    for (const { icon, key } of links) {
      const label = game.i18n.localize(`DW-FR.Links.${key}Title`);
      const url = game.i18n.localize(`DW-FR.Links.${key}URL`);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<i class="${icon}"></i> ${label} <sup><i class="fa-light fa-up-right-from-square"></i></sup>`;
      btn.onclick = () => window.open(url, "_blank");
      section.append(btn);
    }

    header.parentNode.insertBefore(section, header);

    const logo = section.querySelector(".mh-dynamic-logo");
    const observer = new MutationObserver(() => {
      const newSrc = getLogoPath();
      if (logo && logo.getAttribute("src") !== newSrc) logo.setAttribute("src", newSrc);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  } catch (e) {
    error("Erreur renderSettings:", e);
  }
});

// =========================
// Partage de portrait d'acteur
// =========================
function getActorPortrait(actor) {
  return actor?.img || actor?.prototypeToken?.texture?.src || null;
}

async function showAndShareActorImage(actor) {
  try {
    if (!actor) return ui.notifications.warn("Aucun acteur trouvé");
    const imagePath = getActorPortrait(actor);
    if (!imagePath) return ui.notifications.warn(`Aucune image de profil pour ${actor.name}`);

    log(`Ouverture du portrait de ${actor.name}: ${imagePath}`);

    const ImagePopout = foundry.applications.apps.ImagePopout;
    const popout = new ImagePopout({
      src: imagePath,
      window: { title: actor.name },
      shareable: true,
      uuid: actor.uuid,
    });

    await popout.render(true);
    await new Promise((r) => setTimeout(r, 150));

    if (game.user.isGM) {
      popout.share?.() ?? ImagePopout.shareImage?.(imagePath, { title: actor.name });
    }
  } catch (e) {
    error("Erreur showAndShareActorImage:", e);
    ui.notifications.error("Erreur lors du partage du portrait");
  }
}

Hooks.on("renderActorSheet", (app, html) => {
  try {
    const root = html[0] ?? html;
    const img =
      root.querySelector("img[data-edit='img']") ||
      root.querySelector(".profile img, .sheet-profile img, .actor-image img, header img");

    if (!img || img.dataset.sharePortraitBound) return;
    img.dataset.sharePortraitBound = "true";

    img.addEventListener(
      "contextmenu",
      async (event) => {
        event.preventDefault();
        event.stopPropagation();
        log("Clic droit détecté sur le portrait de", app.actor?.name);
        await showAndShareActorImage(app.actor);
      },
      { capture: true }
    );
  } catch (e) {
    error("Erreur renderActorSheet (share portrait):", e);
  }
});

// =========================
// Infobulles des tags
// =========================
let TAG_CACHE = null;

Hooks.once("ready", async () => {
  const pack = game.packs.get("dungeonworld.tags");
  if (!pack) {
    warn("Compendium 'dungeonworld.tags' introuvable !");
    return;
  }

  const entries = await pack.getDocuments();
  TAG_CACHE = {};

  log(`${entries.length} tags chargés depuis dungeonworld.tags`);
  console.groupCollapsed("DW-fr | Liste des tags chargés");

  for (const entry of entries) {
    const name = entry.name.trim().toLowerCase();
    const desc = entry.system?.description || entry.system?.desc || "(aucune description)";
    TAG_CACHE[name] = desc;
    console.log(`${entry.name}:`, desc.replace(/<[^>]*>?/gm, "").trim());
  }

  console.groupEnd();
});

Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor || actor.type !== "npc" || !TAG_CACHE) return;

  const tagElements = html.find(".tagify__tag-text");
  tagElements.each((i, el) => {
    const tagName = el.innerText.trim().toLowerCase();
    const desc = TAG_CACHE[tagName];
    if (desc) {
      el.removeAttribute("title");
      el.dataset.tooltip = desc;
      el.dataset.tooltipDirection = "UP";
    } else {
      warn(`Tag introuvable dans le compendium: ${tagName}`);
    }
  });
});

Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor || actor.type !== "npc") return;

  const highlightTags = ["proche", "allonge", "dévastateur", "puissant", "contact", "longue", "courte"];
  const tagElements = html.find(".tagify__tag-text");

  tagElements.each((i, el) => {
    const tagName = el.innerText.trim().toLowerCase();
    if (highlightTags.includes(tagName)) el.classList.add("dw-tag-highlight");
  });
});

// =========================
// Correction automatique des dégâts vides pour certains monstres
// =========================
Hooks.on("createActor", (actor) => {
  if (actor.type !== "npc") return;

  const src = actor._stats?.compendiumSource || "";
  if (!/Compendium\.dungeonworld\.monsters-/i.test(src)) return;

  const targets = ["Goliath", "Sauropode", "Élémentaire Conceptuel", "Démon du Mot", "La Tarasque"];
  if (!targets.includes(actor.name)) return;

  setTimeout(async () => {
    const dmg = actor.system?.attributes?.damage ?? {};
    const update = {};
    const logChanges = [];

    const val = typeof dmg.value === "string" ? dmg.value.trim() : dmg.value;
    const pierce = typeof dmg.piercing === "string" ? dmg.piercing.trim() : dmg.piercing;

    if (!val) {
      update["system.attributes.damage.value"] = "\u00A0";
      logChanges.push({ field: "system.attributes.damage.value", old: val ?? "(undefined)", new: "␣ (espace insécable)" });
    }
    if (!pierce) {
      update["system.attributes.damage.piercing"] = "\u00A0";
      logChanges.push({ field: "system.attributes.damage.piercing", old: pierce ?? "(undefined)", new: "␣ (espace insécable)" });
    }

    if (Object.keys(update).length) {
      await actor.update(update);

      console.groupCollapsed(`DW-fr | ${actor.name} corrigé`);
      for (const c of logChanges) console.log(`🔧 ${c.field}:`, { ancien: c.old, remplacéPar: c.new });
      console.groupEnd();

      ui.notifications.info(`✅ ${actor.name} corrigé (${logChanges.length} champ${logChanges.length > 1 ? "s" : ""} modifié${logChanges.length > 1 ? "s" : ""}).`);
    }
  }, 500);
});

// =========================
// Nettoyage IA au chargement (perf: 1 getDocuments() par pack)
// =========================
Hooks.once("ready", async () => {
  const useAI = game.settings.get("dungeonworld-fr", "useAIContent");
  const PLACEHOLDER = "icons/svg/mystery-man.svg";

  const AI_IMAGE_PATHS = [
    "modules/dungeonworld-fr/assets/npc-e1",
    "modules/dungeonworld-fr/assets/npc-e2",
    "modules/dungeonworld-fr/assets/npc-e3",
    "modules/dungeonworld-fr/assets/npc-e4",
    "modules/dungeonworld-fr/assets/npc-e5",
    "modules/dungeonworld-fr/assets/npc-e6",
    "modules/dungeonworld-fr/assets/npc-e7",
    "modules/dungeonworld-fr/assets/npc-e8",
    "modules/dungeonworld-fr/assets/npc-e9",
  ];

  const PACK_IDS = [
    "dungeonworld.monsters-01-cavern-dwellers",
    "dungeonworld.monsters-02-swamp-denizens",
    "dungeonworld.monsters-03-undead-legions",
    "dungeonworld.monsters-04-dark-woods",
    "dungeonworld.monsters-05-ravenous-hordes",
    "dungeonworld.monsters-06-twisted-experiments",
    "dungeonworld.monsters-07-lower-depths",
    "dungeonworld.monsters-08-planar-powers",
    "dungeonworld.monsters-09-folk-of-the-realm",
  ];

  const isAiImage = (img) => !!img && AI_IMAGE_PATHS.some((path) => normPath(img).includes(path));

  if (useAI) {
    log("Contenu IA activé — aucune suppression effectuée.");
    document.body.classList.add("ai-enabled");
    return;
  }

  if (!game.user.isGM) return;
  log("Contenu IA désactivé — nettoyage des images IA en cours...");

  for (const id of PACK_IDS) {
    const pack = game.packs.get(id);
    if (!pack) continue;

    const wasLocked = pack.locked ?? pack.metadata?.locked ?? false;
    if (wasLocked) await pack.configure({ locked: false });

    // Perf: charge tous les docs une seule fois
    const docs = await pack.getDocuments();
    let updated = 0;

    for (const doc of docs) {
      const updates = {};
      let changed = false;

      if (isAiImage(doc.img)) {
        updates.img = PLACEHOLDER;
        changed = true;
      }

      // Actor prototype token (champ principal v12+)
      if (doc.prototypeToken?.texture?.src && isAiImage(doc.prototypeToken.texture.src)) {
        updates["prototypeToken.texture.src"] = PLACEHOLDER;
        changed = true;
      }

      // Compat si doc.token existe dans certains cas
      if (doc.token?.texture?.src && isAiImage(doc.token.texture.src)) {
        updates["token.texture.src"] = PLACEHOLDER;
        changed = true;
      }

      if (changed) {
        await doc.update(updates);
        updated++;
      }
    }

    if (wasLocked) await pack.configure({ locked: true });
    if (updated > 0) console.log(`🧽 [${pack.metadata.label}] ${updated} documents nettoyés.`);
  }

  log("Nettoyage des images IA terminé.");
});

// =========================
// Empêche l’import des images IA (Acteurs, Tokens, Items)
// =========================
Hooks.on("preCreateActor", (actor, data) => {
  const useAI = game.settings.get("dungeonworld-fr", "useAIContent");
  if (useAI) return;

  const PLACEHOLDER = "icons/svg/mystery-man.svg";
  const img = normPath(data.img ?? "");

  if (img.includes("modules/dungeonworld-fr/assets/npc-e")) {
    actor.updateSource({ img: PLACEHOLDER });
  }

  if (data.token?.texture?.src?.includes("modules/dungeonworld-fr/assets/npc-e")) {
    actor.updateSource({ "token.texture.src": PLACEHOLDER });
  }

  if (data.prototypeToken?.texture?.src?.includes("modules/dungeonworld-fr/assets/npc-e")) {
    actor.updateSource({ "prototypeToken.texture.src": PLACEHOLDER });
  }

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item.img?.includes("modules/dungeonworld-fr/assets/npc-e")) {
        item.img = PLACEHOLDER;
      }
    }
  }
});
