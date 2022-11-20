Hooks.on('init', () => {
    game.settings.register('dungeonworld-fr', 'autoRegisterBabel', {
      name: 'Activer automatiquement la traduction via Babele',
      hint: 'Met automatiquement en place les traductions au sein de Babele sans avoir besoin de pointer vers le répertoire contenant les traductions.',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
      onChange: value => {
        if (value) {
          autoRegisterBabel();
        }
  
        window.location.reload();
      },
    });
  
    if (game.settings.get('dungeonworld-fr', 'autoRegisterBabel')) {
      autoRegisterBabel();
    }
  });
  
  function autoRegisterBabel() {
    if (typeof Babele !== 'undefined') {
      Babele.get().register({
        module: 'dungeonworld-fr',
        lang: 'fr',
        dir: 'compendium',
      });
    }
  }