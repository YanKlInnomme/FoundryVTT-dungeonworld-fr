// Initialisation Babele
Hooks.once('babele.init', () => {
  if (!game.babele) return;
  game.babele.register({
    module: 'dungeonworld-fr',
    lang: 'fr',
    dir: 'compendium'
  });
});

// Préfixe de log
const DW_PREFIX = "DW-fr |";
const log = (...a) => console.log(DW_PREFIX, ...a);
const warn = (...a) => console.warn(DW_PREFIX, ...a);
const error = (...a) => console.error(DW_PREFIX, ...a);

// Confirmation de chargement
Hooks.once("ready", () => log("Module DungeonWorld-FR chargé avec succès ✔️"));

// Gestion automatique des images de tokens
function generateTokenImageFilenames(name, ext) {
  const variants = [
    '-token', '_token', 'token', '(token)', '[token]',
    '%20-%20token', '%20_%20token', '%20token', '%20(token)', '%20[token]',
    '-Token', '_Token', 'Token', '(Token)', '[Token]',
    '%20-%20Token', '%20_%20Token', '%20Token', '%20(Token)', '%20[Token]'
  ];
  return variants.map(variant => `${name}${variant}.${ext}`);
}

async function fileExists(filePath) {
  const basePath = filePath.split('/').slice(0, -1).join('/');
  try {
    const result = await FilePicker.browse('data', basePath);
    return result.files.includes(filePath);
  } catch {
    return false;
  }
}

async function getTokenImagePath(actorImgPath) {
  const parts = actorImgPath.split('/');
  const [name, ext] = parts.pop().split('.');
  const basePath = parts.join('/');
  const candidates = generateTokenImageFilenames(name, ext).map(f => `${basePath}/${f}`);

  const results = await Promise.all(candidates.map(async path => (await fileExists(path)) ? path : null));
  return results.find(Boolean) || actorImgPath;
}

Hooks.on("updateActor", async (actor, data) => {
  if (!data.img) return;
  try {
    const tokenImg = await getTokenImagePath(data.img);
    await actor.prototypeToken.update({ "texture.src": tokenImg });
    for (const token of actor.getActiveTokens(true)) {
      await token.document.update({ "texture.src": tokenImg });
    }
  } catch (e) {
    error("Erreur dans le hook updateActor:", e);
  }
});

Hooks.on("createToken", async (tokenDoc, options, userId) => {
  try {
    let originalSrc = tokenDoc.texture?.src;
    const actorImg = tokenDoc.actor?.img;

    // 1️⃣ Fallback sur l’image de l’acteur si celle du token est vide ou par défaut
    if (!originalSrc || originalSrc.includes("icons/svg/mystery-man.svg")) {
      if (actorImg) {
        log(`Token sans image, fallback sur actor.img: ${actorImg}`);
        originalSrc = actorImg;
      } else {
        warn("Aucun actor.img trouvé, on garde l’image par défaut.");
        return;
      }
    }

    // 2️⃣ Vérification d’existence réelle du fichier
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    const basePath = originalSrc.split("/").slice(0, -1).join("/");
    const browse = await FilePickerImpl.browse("data", basePath);
    const fileExists = browse.files.includes(originalSrc);

    if (!fileExists) {
      warn(`Image introuvable: ${originalSrc}`);
      if (actorImg && actorImg !== originalSrc) {
        log(`Remplacement par actor.img: ${actorImg}`);
        originalSrc = actorImg;
      } else {
        warn("Utilisation du placeholder par défaut.");
        originalSrc = "icons/svg/mystery-man.svg";
      }
    }

    // 3️⃣ Cherche la version *-token si elle existe
    const tokenImg = await getTokenImagePath(originalSrc);

    // 4️⃣ Applique si différence
    if (tokenImg && tokenImg !== tokenDoc.texture?.src) {
      await tokenDoc.update({ "texture.src": tokenImg });
      log(`Texture corrigée juste après création → ${tokenImg}`);
    } else {
      log("Aucune modification nécessaire (texture identique).");
    }

  } catch (e) {
    error("Erreur createToken:", e);
  }
});

// Section personnalisée dans les paramètres
Hooks.on("renderSettings", (app, html) => {
  const header = html.querySelector("h4.divider");
  if (!header) return error("Aucun <h4.divider> trouvé dans les paramètres");

  const defaultLogos = { light: "logo.svg", dark: "logo-dark.svg" };

  const getTheme = () => html.classList.contains("theme-dark")
    ? "dark" : html.classList.contains("theme-light")
    ? "light" : game.settings.get("core", "uiConfig")?.colorScheme?.interface ?? "light";

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
    { icon: "fa-regular fa-mug-hot fa-bounce", key: "Donation" }
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

  // Mise à jour auto du logo selon le thème
  const logo = section.querySelector(".mh-dynamic-logo");
  const observer = new MutationObserver(() => {
    const newSrc = getLogoPath();
    if (logo.src !== newSrc) logo.src = newSrc;
  });
  observer.observe(html, { attributes: true, attributeFilter: ["class"] });
});

// Partage de portrait d'acteur
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
      uuid: actor.uuid
    });

    await popout.render(true);
    await new Promise(r => setTimeout(r, 150)); // attendre l’enregistrement

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

    img.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      log("Clic droit détecté sur le portrait de", app.actor?.name);
      await showAndShareActorImage(app.actor);
    }, { capture: true });

  } catch (e) {
    error("Erreur renderActorSheet:", e);
  }
});

// Infobulles des tags
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

  for (let entry of entries) {
    const name = entry.name.trim().toLowerCase();
    const desc = entry.system?.description || entry.system?.desc || "(aucune description)";
    TAG_CACHE[name] = desc;
    console.log(`${entry.name}:`, desc.replace(/<[^>]*>?/gm, '').trim());
  }

  console.groupEnd();
});

Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor || actor.type !== "npc" || !TAG_CACHE) return;

  // Ciblage des éléments tagify
  const tagElements = html.find(".tagify__tag-text");

  tagElements.each((i, el) => {
    const tagName = el.innerText.trim().toLowerCase();
    const desc = TAG_CACHE[tagName];
    if (desc) {
      el.removeAttribute("title");
      el.dataset.tooltip = desc;
      el.dataset.tooltipDirection = "UP";
    } else {
      // Pour le debug : montre les tags non trouvés
      warn(`Tag introuvable dans le compendium: ${tagName}`);
    }
  });
});

// Mise en évidence de certains tags
Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor || actor.type !== "npc") return;

  // Liste des tags à mettre en évidence (en minuscules)
  const highlightTags = [
    "proche",
    "allonge",
    "dévastateur",
    "puissant",
    "contact",
    "longue",
    "courte",
  ];

  // Ciblage des éléments de texte Tagify
  const tagElements = html.find(".tagify__tag-text");

  tagElements.each((i, el) => {
    const tagName = el.innerText.trim().toLowerCase();

    if (highlightTags.includes(tagName)) {
      el.classList.add("dw-tag-highlight");
    }
  });
});

// Correction automatique des dégâts vides pour certains monstres
Hooks.on("createActor", (actor, options, userId) => {
  if (actor.type !== "npc") return;

  const src = actor._stats?.compendiumSource || "";
  if (!/Compendium\.dungeonworld\.monsters-/i.test(src)) return;

  const targets = [
    "Goliath",
    "Sauropode",
    "Élémentaire Conceptuel",
    "Démon du Mot",
    "La Tarasque"
  ];
  if (!targets.includes(actor.name)) return;

  // Attendre que Babele ait fini ses modifs
  setTimeout(async () => {
    const dmg = actor.system?.attributes?.damage ?? {};
    const update = {};
    const logChanges = [];

    const val = typeof dmg.value === "string" ? dmg.value.trim() : dmg.value;
    const pierce = typeof dmg.piercing === "string" ? dmg.piercing.trim() : dmg.piercing;

    // Vérifie value
    if (!val) {
      update["system.attributes.damage.value"] = "\u00A0";
      logChanges.push({
        field: "system.attributes.damage.value",
        old: val ?? "(undefined)",
        new: "␣ (espace insécable)"
      });
    }

    // Vérifie piercing
    if (!pierce) {
      update["system.attributes.damage.piercing"] = "\u00A0";
      logChanges.push({
        field: "system.attributes.damage.piercing",
        old: pierce ?? "(undefined)",
        new: "␣ (espace insécable)"
      });
    }

    if (Object.keys(update).length) {
      await actor.update(update);

      // 🎯 Log détaillé en console
      console.groupCollapsed(`DW-fr | ${actor.name} corrigé`);
      for (const c of logChanges) {
        console.log(`🔧 ${c.field}:`, { ancien: c.old, remplacéPar: c.new });
      }
      console.groupEnd();

      ui.notifications.info(`✅ ${actor.name} corrigé (${logChanges.length} champ${logChanges.length > 1 ? "s" : ""} modifié${logChanges.length > 1 ? "s" : ""}).`);
    }
  }, 500);
});

// Ajout d’un paramètre pour activer/désactiver le nettoyage des images IA
Hooks.once("init", () => {
  // Enregistrement du paramètre
  game.settings.register("dungeonworld-fr", "useAIContent", {
    name: game.i18n.localize("DW-FR.Settings.useAdditionalContentName"),
    hint: game.i18n.localize("DW-FR.Settings.useAdditionalContentHint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: value => {
      // ⚡ Auto-refresh du monde quand l’option change
      ui.notifications.info(
        value
          ? "Contenu IA activé — Rechargement nécessaire..."
          : "Contenu IA désactivé — Rechargement nécessaire..."
      );
      setTimeout(() => window.location.reload(), 1000);
    }
  });
});

Hooks.once("ready", async () => {
  const useAI = game.settings.get("dungeonworld-fr", "useAIContent");
  const PLACEHOLDER = "icons/svg/mystery-man.svg";

  // Dossiers à surveiller
  const AI_IMAGE_PATHS = [
    "modules/dungeonworld-fr/assets/npc-e1",
    "modules/dungeonworld-fr/assets/npc-e2",
    "modules/dungeonworld-fr/assets/npc-e3",
    "modules/dungeonworld-fr/assets/npc-e4",
    "modules/dungeonworld-fr/assets/npc-e5",
    "modules/dungeonworld-fr/assets/npc-e6",
    "modules/dungeonworld-fr/assets/npc-e7",
    "modules/dungeonworld-fr/assets/npc-e8",
    "modules/dungeonworld-fr/assets/npc-e9"
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
    "dungeonworld.monsters-09-folk-of-the-realm"
  ];

  const isAiImage = (img) => !!img && AI_IMAGE_PATHS.some(path => img.includes(path));

  // --- Si l'utilisateur veut afficher les images IA, on stoppe tout ---
  if (useAI) {
    log("Contenu IA activé — aucune suppression effectuée.");
    document.body.classList.add("ai-enabled"); // utile pour le CSS
    return;
  }

  // Sinon : on nettoie les compendiums
  if (!game.user.isGM) return;
  log("Contenu IA désactivé — nettoyage des images IA en cours...");

  for (const id of PACK_IDS) {
    const pack = game.packs.get(id);
    if (!pack) continue;
    const wasLocked = pack.locked ?? pack.metadata?.locked ?? false;
    if (wasLocked) await pack.configure({ locked: false });

    await pack.getIndex();
    let updated = 0;

    for (const entry of pack.index) {
      const doc = await pack.getDocument(entry._id);
      if (!doc) continue;
      let changed = false;
      const updates = {};

      if (isAiImage(doc.img)) {
        updates.img = PLACEHOLDER;
        changed = true;
      }

      if (doc.token?.texture?.src && isAiImage(doc.token.texture.src)) {
        updates["token.texture.src"] = PLACEHOLDER;
        changed = true;
      }

      if (doc.prototypeToken?.texture?.src && isAiImage(doc.prototypeToken.texture.src)) {
        updates["prototypeToken.texture.src"] = PLACEHOLDER;
        changed = true;
      }

      if (doc.items?.size > 0) {
        for (const item of doc.items) {
          if (isAiImage(item.img)) {
            item.updateSource({ img: PLACEHOLDER });
            changed = true;
          }
        }
      }

      if (changed) {
        await doc.update(updates);
        updated++;
      }
    }

    if (wasLocked) await pack.configure({ locked: true });
    if (updated > 0)
      console.log(`🧽 [${pack.metadata.label}] ${updated} documents nettoyés.`);
  }

  log("Nettoyage des images IA terminé.");
});

// Empêche l’import des images IA (Acteurs, Tokens, Items)
Hooks.on("preCreateActor", (actor, data) => {
  const useAI = game.settings.get("dungeonworld-fr", "useAIContent");
  if (useAI) return; // Si IA activée, ne rien faire

  const PLACEHOLDER = "icons/svg/mystery-man.svg";
  const img = data.img ?? "";

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
