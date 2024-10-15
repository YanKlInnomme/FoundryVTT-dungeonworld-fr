Hooks.on('babele.init', () => {
  if (game.babele) {
    game.babele.register({
      module: 'dungeonworld-fr',
      lang: 'fr',
      dir: 'compendium'
    });
  }
});

Hooks.on("renderSettings", (app, html) => {
  const links = {
    shop: {
      title: "500 Nuances de Geek",
      url: "https://www.500nuancesdegeek.fr/boutique/7-dungeon-world",
      iconClass: "fa-solid fa-cart-shopping"
    },
    git: {
      title: "Dépôt du module",
      url: "https://github.com/YanKlInnomme/FoundryVTT-dungeonworld-fr",
      iconClass: "fab fa-github"
    },
    donation: {
      title: "Offre-moi un café",
      url: "https://www.buymeacoffee.com/yank",
      iconClass: "fa-regular fa-mug-hot fa-bounce"
    }
  };

  const createButton = (text, iconClass, url) => {
    const button = $(`<button><i class="${iconClass}"></i> ${text}</button>`);
    button.on("click", ev => {
      ev.preventDefault();
      window.open(url, "_blank");
    });
    return button;
  };
  
  const addLinkButton = (container, link) => {
    const button = createButton(link.title, link.iconClass, link.url);
    container.append(button);
  };

  const title = "Dungeonworld-fr · Liens";
  const lotdSection = $(`<h2>${title} <i class="fa-light fa-up-right-from-square"></i></h2>`);
  html.find("#settings-game").after(lotdSection);

  const lotdDiv = $(`<div></div>`);
  lotdSection.after(lotdDiv);

  Object.values(links).forEach(link => {
    addLinkButton(lotdDiv, link);
  });
});

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
  } catch (error) {
    return false;
  }
}

async function getTokenImagePath(actorImgPath) {
  const imgParts = actorImgPath.split('/');
  const fileName = imgParts.pop();
  const [name, ext] = fileName.split('.');
  const basePath = imgParts.join('/');

  const possibleFilenames = generateTokenImageFilenames(name, ext);

  const fileChecks = possibleFilenames.map(async (tokenFileName) => {
    const tokenImgPath = `${basePath}/${tokenFileName}`;
    return await fileExists(tokenImgPath) ? tokenImgPath : null;
  });

  const results = await Promise.all(fileChecks);
  const tokenImgPath = results.find(path => path !== null);

  return tokenImgPath || actorImgPath;
}

Hooks.on("updateActor", async (actor, data, options, userId) => {
  try {
    if (data.img) {
      const tokenImg = await getTokenImagePath(data.img);

      await actor.prototypeToken.update({ "texture.src": tokenImg });

      const tokens = actor.getActiveTokens(true);
      for (let token of tokens) {
        await token.document.update({ "texture.src": tokenImg });
      }
    }
  } catch (error) {
    console.error('Error in updateActor hook:', error);
  }
});
