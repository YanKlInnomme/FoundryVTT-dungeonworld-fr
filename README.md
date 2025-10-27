![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FYanKlInnomme%2FFoundryVTT-dungeonworld-fr%2Fmaster%2Fmodule.json&query=%24.compatibility.verified&label=foundry%20vtt&color=%23ee9b3a) ![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FYanKlInnomme%2FFoundryVTT-dungeonworld-fr%2Fmaster%2Fmodule.json&query=%24.version&label=version&color=%230f2f2b) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/YanKlInnomme/FoundryVTT-dungeonworld-fr/total) ![GitHub Issues or Pull Requests](https://img.shields.io/github/issues-raw/YanKlInnomme/FoundryVTT-dungeonworld-fr) ![GitHub Issues or Pull Requests](https://img.shields.io/github/issues-closed-raw/YanKlInnomme/FoundryVTT-dungeonworld-fr) ![GitHub forks](https://img.shields.io/github/forks/YanKlInnomme/FoundryVTT-dungeonworld-fr) ![GitHub Repo stars](https://img.shields.io/github/stars/YanKlInnomme/FoundryVTT-dungeonworld-fr) <a href="https://www.buymeacoffee.com/yank">![Static Badge](https://img.shields.io/badge/buy_me_a_coffee-FFDD00?logo=Buy%20Me%20A%20Coffee&logoColor=black)</a>

**See below for the English version**

# Module dungeonworld-fr pour Foundry VTT
Améliorer votre expérience de jeu avec ce module de traduction intégrale VF pour la version Dungeon World d'Asacolips pour Foundry VTT.

![Capture d’écran 2022-11-20 125446](https://user-images.githubusercontent.com/100078854/202900602-9292b8a9-f61c-4114-bbb3-273fd731de8d.jpg)
![Capture d’écran 2022-11-20 125713](https://user-images.githubusercontent.com/100078854/202900603-889e9b72-d747-46da-8bd6-15a93cfdf2dd.jpg)

Si vous appréciez le module et que vous avez les moyens de le faire, vous pouvez me soutenir en m'offrant un café sur Buy Me a Coffee (https://www.buymeacoffee.com/yank). Votre geste sera grandement apprécié et contribuera à soutenir le développement continu. Quoi qu'il en soit, je vous souhaite une expérience enrichissante et divertissante. N'hésitez pas à me contacter pour partager vos commentaires ou signaler tout problème éventuel.

## Prérequis

Afin de fonctionner ce module nécessite les installations préalables suivantes :
 * Le système Dungeon World d'Asacolips
 * Le module Babele (L'indispensable pour faire de la traduction)
 * Le module Lib-wrapper (Requis par Babele)

## Version 3.0.0
 * Mise à jour suite au passage à la version 13 du système Dungeon World d'Asacolips
 * Traduction des compendiums "Actor" (9/9 soit 100%) :
    - E1 - Habitants des Cavernes (dungeonworld.monsters-01-cavern-dwellers.json)
    - E2 - Habitants des Marais (dungeonworld.monsters-02-swamp-denizens.json)
    - E3 - Légion des Morts-vivants (dungeonworld.monsters-03-undead-legions.json)
    - E4 - Bois sombres (dungeonworld.the-barbarian-moves.json)
    - E5 - Hordes Voraces (dungeonworld.monsters-05-ravenous-hordes.json)
    - E6 - Expériences contre Nature (dungeonworld.monsters-06-twisted-experiments.json)
    - E7 - Tréfonds (dungeonworld.monsters-07-lower-depths.json)
    - E8 - Forces Planaires (dungeonworld.monsters-08-planar-powers.json)
    - E9 - Gens du Royaume (dungeonworld.monsters-09-folk-of-the-realm.json)
 * Mise à jour des compendiums "JournalEntry" (3/3 soit 100%) :
    - Actions et Principes du·de la MJ (dungeonworld.gm-movesprincipals.json)
    - Écran du·de la MJ (dungeonworld.gm-screen.json)
    - Services et biens (dungeonworld.charts.json)
 * Mise à jour des liens Boutique, Dépot et Donation dans l'onglet 'Paramètres'
 * Mise en place du logo "Dungeon World" sélectif en fonction du thème (sombre/clair)
 * Gestion automatique des images de tokens en fonction de la présence du mot "Token" dans le nom du fichier image
 * Ajout d'une fonction d'affichage du portrait de l'acteur actif par un simple clic droit sur l'image afin d'en faciliter le partage
 * Ajout d'info-bulles sur les marqueurs afin d'en faciliter la compréhension, y compris mise en évidence des marqueurs liés aux combats
 * Ajout d'une fonction de correction automatique des dégâts vides pour certains monstres importés (post-Babele)
 * Ajout d'illutrations IA aux compendiums "Actor" pour une meilleure immersion visuelle :
     - Désactivée par défaut (peut être activée/désactivée dans les paramètres du module)
     - Avancement 24/154 soit ~16%
 * Mise à jour du fichier de traduction (fr.json) avec les nouvelles variables ajoutées dans la version 13

## Version 2.1.1
 * Correction mineure de l'archive

## Version 2.1.0
 * Mise à jour suite au passage à la version 12 du système Dungeon World d'Asacolips
 * Mise à jour du compendium "Item" : Classes (dungeonworld.classes.json)
 * Mise à jour du css pour un meilleur visuel lorsque le jeu est en pause
 * Ajout des variables manquantes dans le fichier de traduction (fr.json)
 * Ajout des liens Boutique, Dépot et Donation dans l'onglet 'Paramètres'

## Version 2.0.1
 * Mise à jour du manifeste pour une activation correcte des modules requis

## Version 2.0.0
 * Traduction des compendiums "Item" (21/21 soit 100%) réalisée par Matisse :
    - Actions du·de la Druide·sse (dungeonworld.the-druid-moves.json)
    - Actions du·de la Immolateur·rice (dungeonworld.the-immolator-moves.json)
    - Actions du·de la Paladin·e (dungeonworld.the-paladin-moves.json)
 * Traduction des compendiums "JournalEntry" (3/3 soit 100%) réalisée par Matisse :
    - Actions et Principes du·de la MJ (dungeonworld.gm-movesprincipals.json)
    - Écran du·de la MJ (dungeonworld.gm-screen.json)
    - Services et biens (dungeonworld.charts.json)
 * Traduction des compendiums "RollTable" (2/2 soit 100%) réalisée par Matisse :
    - Tables Aléatoires (dungeonworld.tables.json)
    - Tables Aléatoires II (dungeonworld.rollable-tables.json)

## Version 1.0.0
 * Ajout de Logo et Modification de la Pause
 * Mise à Jour et Compléments de Traduction des variables du système (fr.json)
 * Traduction des compendiums "Item" (18/21 soit ~86%) :
    - Actions (dungeonworld.basic-moves.json)
    - Actions de l'Éclaireur·euse (dungeonworld.the-ranger-moves.json)
    - Actions du·de la Barbare (dungeonworld.the-barbarian-moves.json)
    - Actions du·de la Barde·sse (dungeonworld.the-bard-moves.json)
    - Actions du·de la Clerc (dungeonworld.the-cleric-moves.json)
    - Actions du·de la Guerrier·ère (dungeonworld.the-fighter-moves.json)
    - Actions du·de la Magicien·ne (dungeonworld.the-wizard-moves.json)
    - Actions du·de la Voleur·euse (dungeonworld.the-thief-moves.json)
    - Classes (dungeonworld.classes.json)
    - Équipement (Armes) (dungeonworld.equipment-weapons.json)
    - Équipement (Armure) (dungeonworld.equipment-armor.json)
    - Équipement (Classe) (dungeonworld.equipment-class.json)
    - Équipement (Magie) (dungeonworld.equipment-magic.json)
    - Équipement (Matériel) (dungeonworld.equipment-gear.json)
    - Équipement (Poisons) (dungeonworld.equipment-poisons.json)
    - Étiquettes (dungeonworld.tags.json)
    - Sorts du·de la Clerc (dungeonworld.the-cleric-spells.json)
    - Sorts du·de la Magicien·ne (dungeonworld.the-wizard-spells.json)

## À venir...
 * Traduction des compendiums "Actor" (Monstres 1 à 9)

---------------------------------------------------------------------

Enhance your gaming experience with this full VF translation module for the Dungeon World version of Asacolips for Foundry VTT.

If you enjoy the module and have the means to do so, you can support me by buying me a coffee on Buy Me a Coffee (https://www.buymeacoffee.com/yank). Your gesture will be greatly appreciated and will help support ongoing development. In any case, I wish you a rewarding and entertaining experience. Feel free to contact me to share your feedback or report any issues.

## Prerequisites

In order to work this module requires the following prerequisites:
 * The Dungeon World system from Asacolips
 * The Babele module (essential for translation)
 * The Lib-wrapper module (Required by Babele)

## Version 2.1.1
   * Minor correction of the archive

## Version 2.1.0
 * Update following the switch to version 12 of the Dungeon World system from Asacolips
 * Update of the "Item" compendium: Classes (dungeonworld.classes.json)
 * Update of the css for a better visual when the game is paused
 * Addition of missing variables in the translation file (fr.json)
 * Addition of Shop, Deposit and Donation links in the 'Settings' tab

## Version 2.0.1
 * Updated the manifest for proper activation of required modules

## Version 2.0.0
 * Translation of the "Item" compendiums (21/21 or 100%) made by Matisse :
    - Actions of the Druid (dungeonworld.the-druid-moves.json)
    - Actions of the Immolator (dungeonworld.the-immolator-moves.json)
    - Actions of the Paladin (dungeonworld.the-paladin-moves.json)
 * Translation of the "JournalEntry" compendiums (3/3 or 100%) by Matisse :
    - Actions and Principles of the GM (dungeonworld.gm-movesprincipals.json)
    - The GM's screen (dungeonworld.gm-screen.json)
    - Services and goods (dungeonworld.charts.json)
 * Translation of the "RollTable" compendiums (2/2 or 100%) made by Matisse :
    - Random Tables (dungeonworld.tables.json)
    - Random Tables II (dungeonworld.rollable-tables.json)

## Version 1.0.0
 * Logo addition and Pause modification
 * Update and Addition of Translation of the system variables (fr.json)
 * Translation of "Item" compendiums (18/21 or ~86%) :
    - Actions (dungeonworld.basic-moves.json)
    - Actions of the Ranger (dungeonworld.the-ranger-moves.json)
    - Actions of the Barbarian (dungeonworld.the-barbarian-moves.json)
    - Actions of the Bard (dungeonworld.the-bard-moves.json)
    - Actions of the Cleric (dungeonworld.the-cleric-moves.json)
    - Actions of the Fighter (dungeonworld.the-fighter-moves.json)
    - Actions of the Wizard (dungeonworld.the-wizard-moves.json)
    - Actions of the Thief (dungeonworld.the-thief-moves.json)
    - Classes (dungeonworld.classes.json)
    - Equipment (Weapons) (dungeonworld.equipment-weapons.json)
    - Equipment (Armor) (dungeonworld.equipment-armor.json)
    - Equipment (Class) (dungeonworld.equipment-class.json)
    - Equipment (Magic) (dungeonworld.equipment-magic.json)
    - Equipment (Equipment) (dungeonworld.equipment-gear.json)
    - Equipment (Poisons) (dungeonworld.equipment-poisons.json)
    - Tags (dungeonworld.tags.json)
    - Spells of the Cleric (dungeonworld.the-cleric-spells.json)
    - Spells of the Wizard (dungeonworld.the-wizard-spells.json)

## Coming soon...
 * Translation of the "Actor" compendiums (Monsters 1 to 9)