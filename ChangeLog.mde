# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).´

## [5.8.2] - 2026-06-09

**Compatible Foundry Version:** 14.363

### Added

- Added special syntax support to Active Effects that allows them to influence the Base Chance of Skill Tests. See system's wiki for details.
- Added 'Advanced Mode' to Active Effect changes' attribute keys, allowing the targeting of token data.
- Added system option for Starter Kit Critical Success on Weapon rolls (+1d6 Fury).
- Added system option for number of Advances to consider a Tier complete (default 21, per Revised Core Rulebook).

### Fixed

- **[CRITICAL]** Fixed inability to edit or delete an Ancestry from a Character after it is added.
- Fixed Withstand Madness rolls not applying Corruption.
- Fixed compendiums not rendering correctly when opened from within an `Actor`'s sheet.

## [5.8.1] - 2026-06-03

**Compatible Foundry Version:** 14.363

### Added

- Added Action Point tracking to Combat Tracker for Characters, Creatures, and NPCs. Use Combat Tracker's built-in resource tracker and select `stats.actionPoints.value`.
- Added new Status Effects based on Zweihänder Revised Core Rulebook / Starter Kit effects: Cover (Low), Cover (Medium), Cover (High), Cover (Total), Infection, Outnumbered, Hastened.
- Added automation for the Cover (Low), Cover (Medium), Cover (High), Cover (Total), and Surprised status effects.
- Added partial automation for the Stunned Status Effect.
- Added new Actor Configuration menu option for permanent Action Points modifiers.
- Added Action Points support to Active Effects.
- Added system option for alternative Action Point assignment at start of combat.

### Fixed

- Fixed a bug that was resulting in error message notifications when a driver / passenger `Actor` in a Vehicle was updated.

## [5.8.0] - 2026-05-30

**Compatible Foundry Version:** 14.363

### Added

- Added support for Foundry V14.
- Added new Status Effects based on Zweihänder Revised Core Rulebook effects: Inspired, Intimidated, Confused, Intoxicated, Delirious, Poisoned, Envenomed, Exhausted, Starving, and Suffocating.
- Added automation for the Inspired and Intimidated Status Effects.
- Added partial automation for the Intoxicated Status Effect.
- Added dynamic tooltips to stats affected by Active Effects with a breakdown consisting of: base value, each modifier, total value.
- Added context menus to most `Item` lists.
- Added context menu to chat messages.
- Added flavorful backgrounds to several system tooltips.

### Fixed

- Fixed a bug that prevented opening Vehicle sheets when sorting drivers / passengers list.
- Fixed a bug where Profession and Ancestry creation checks could be bypassed by using `Item#create`.
- Fixed a bug where Talent names would not be displayed in Profession `Item`s not attached to an `Actor`.
- Fixed a bug where Weapon damage formulas would display incorrectly if Fury Dice exploded on multiple values.

### Misc.

- Transitioned system to Data Models and removed `template.json`.
- Migrated `Actor` Configuration menu data from `flags.zweihander.actorConfig.*` to `system.settings.*`.
- Re-organized system folder structure.
- Misc. CSS adjustments.

## [5.7.3] - 2026-05-06

### Fixed

- Reverted Critical Failure on Withstand Madness tests showing Peril button (RCR p. 420).
- Updated the Spanish localization file to be compatible with Foundry V13.

## [5.7.2] - 2026-05-05

### Fixed

- Fixed Peril damage button not appearing on Critical Failure results for Withstand Madness tests.
- Fixed missing localization keys (thanks Viriato139ac).

## [5.7.1] - 2026-05-04

### Added

- Added peril automation for Withstand Madness rolls.
- Redesigned Player Character sheet layout slightly to accomodate a more generic Withstand Madness test.

### Fixed

- Fixed a rare edge-case bug that would result in damage being applied twice if both Player and GM clicked Apply Damage button at the same time.

### Misc.

- Misc. CSS adjustments to accomodate new Withstand Madness button on Player Character sheet.

## [5.7.0] - 2026-04-29

### Added

- Added damage automation for Damage Rolls.
  - Select a target with 'T' (or multiple targets with Shift + 'T') before clicking the 'Damage' button.
  - Users who are the target of the attack (or the GM) will be able to click an 'Apply Damage' button.
  - Click the target pills on a Damage Roll message to ping the relevant target.
- Added system option to enable or disable currency encumbrance.
- Added a new Actor Configuration setting to override number of d10s in base Initiative formula. Configurable on all `Actor`s except Vehicle.
- Added 100 new Doomings for the immersive pause setting (most from Lowborn #1).
- Added Encumbrance tracking for NPCs.
- Added multi-`Actor` support for Reaction Rolls.
  - Select multiple tokens with Shift + Click before clicking 'Dodge' or 'Parry' button.
- Changed default Initiative formula to include Perception Bonus as a tie-breaker.

### Fixed

- Fixed Limited view not working properly.
- Fixed Vehicle Size Modifier not being copied when right-clicking Manual Mode.
- Fixed 'Close' button displaying on Fortune Tracker for players.
- Fixed lowercase advances when modifying Profession `Item`s.
- Fixed unsorted advances when modifying Profession `Item`s.
- Fixed a bug related to purchase state of Bonus Advances when modifying Profession `Item`s.
- Fixed Qualities not being right-clickable from an `Actor` sheet.

### Misc.

- Removed jQuery dependency from the system. Animations when expanding / collapsing / deleting `Item`s should be smoother.

## [5.6.4] - 2026-01-26

### Added

- Added a check preventing deletion of Professions of a lower Tier when Professions of a higher Tier exist.

### Fixed

- Fixed Character Notes not displaying correctly on Character sheets.
- Fixed `Item` Notes not displaying correctly on `Item` sheets.
- Fixed a bug where number of Fury Dice was defaulting to 1 for Weapon `Item`s.

## [5.6.3] - 2025-12-16

### Fixed

- **[CRITICAL]** Fixed a bug affecting dynamic lists in Ancestry and Profession `Item`s, which was preventing `Actor`s from being affected by their values.
- Fixed Biography and Character Notes not displaying correctly on Character sheets.

## [5.6.2] - 2025-12-15

### Added

- Added support for using roll modes without having to select it on every roll (use buttons above chat).

### Fixed

- **[CRITICAL]** Fixed a bug affecting dynamic lists in Ancestry and Profession `Item`s, which was preventing their customization.
- Fixed Creature / NPC Initiative rolls.
- Fixed chat cards not displaying Parry / Dodge buttons correctly.
- Fixed Ancestral Trait randomization not adding the Ancestral Trait to the Character sheet.

## [5.6.1] - 2025-11-28

### Fixed

- Fixed missing localization keys (thanks Viriato139ac).
- Fixed incorrect User displayed in chat messages.
- Fixed incorrect system version displayed in the sidebar.

## [5.6.0] - 2025-11-25

### Added

- Added support for FoundryVTT V13.
- Added a new optional design for the Player Character sheet header. It now supports custom header backgrounds.
- Added a new design to display system version alongside links to the project source, the wiki, the issue tracker, and the F&H Discord community.
- Added a new design for all chat messages.
- Migrated all `Actor` sheets to the new `ApplicationV2` framework.
- Migrated all `Item` sheets (except Unique Advances) to the new `ApplicationV2` framework.
- Migrated Active Effects Configuration sheet to the new `ApplicationV2` framework.
- Migrated Fortune Tracker application to the new `ApplicationV2` framework.
- Migrated Language Configuration application to the new `ApplicationV2` framework.

### Fixed

- Fixed custom multi-select element issue. Profession `Item` sheet Bonus Advances can now be picked through a dropdown.
- Misc. style adjustments that better fit the FoundryVTT V13 aesthetic.

## [5.5.5] - 2025-05-12

### Added

- Added auto-calculation of Damage Threshold for NPCs when sheet is **not** set to Manual Mode.
- Added Drawback list to NPC sheet.

## [5.5.4] - 2025-05-08

### Added

- Added a system setting to specify default skills to use for Peril and Resist Disease tests.
- Added a system setting to specify default skill to use for Dodge tests for Creatures and NPCs.
- Converted all confirmation dialogs to DialogV2.
- Added French localization.

### Fixed

- Fixed a bug that caused the system to use incorrect base percentages when rolling a Dodge or Parry test from a Creature or NPC sheet with manually input Dodge or Parry values.
- Fixed incorrect Peril labels on Creature and NPC sheets when using the Alternative Peril System.
- Fixed Peril and Resist Disease tests not working in worlds with a custom Skills list.
- Fixed Quality's 'Effect' field not enriching HTML content.

## [5.5.3] - 2025-05-01

### Added

- Added additional localization support.
- Migrated Injury Configuration dialog to DialogV2.

### Fixed

- Refactor remaining on-render localization to be processed inside system's logic.
- Fixed grid units not displaying correctly.
- Fixed mismatched default skills for Parry, Dodge, and Magick on Actor creation.
- Misc. CSS adjustments.

## [5.5.2] - 2025-04-28

- **[CRITICAL]** Fixed drag-and-drop support for Talents on Profession sheets.
- Fixed Compendium localization for Talents and Qualities.

## [5.5.1] - 2025-04-26

### Fixed

- Fixed Ancestries Compendium not showing ancestral modifiers.

## [5.5.0] - 2025-04-26

Compatible Foundry version: 12.331

### Added

- Added new designs for the following Item sheets: Ancestry, Profession, Talent, Trait, Trapping, Weapon, Armor, Trapping, Skill, Disease, Disorder, Drawback, Injury, Quality, Ritual, and Spell.
- Added drag-and-drop support for Ancestry and Profession Item sheets.
- Added a new design for Currency on the Character sheet.
- Added additional Active Effects support. Items can now hold Active Effects.
- Added an option for Players to open a Skill Item's sheet by right-clicking, allowing them to change the Base Chance gain per Rank (relevant for Professions such as the Prostitute).
- Added missing Ruinous Powers Drawbacks for all Covenant Professions.
- Added a new system setting for rolling Initiative.
- Added new system settings that allow users to specify which Compendium packs to use as default.
- Added new system settings that allow users to specify which Skills to use as default for Parry, Dodge, and Magick Tests. These can still be adjusted on a per-Actor basis in the Actor Configuration menu.
- Added descriptions and icons to some Skills (Alchemy - Handle Animal).
- Added icons to all Diseases.
- Added the ability to roll a Toughness Test to resist a Disease from a Disease Item's sheet, provided it is owned by an Actor.
- Added the ability to increase or decrease a Disease's duration, if it has one, from the Character sheet.
- Added Expert Profession validation, preventing a Character that does not meet the requirements from entering the Expert Profession.

### Fixed

- Fixed the Alternative Peril System's ladder to be in line with the latest Reforged rules.
- Fixed open sheets not closing when the associated Item was deleted.
- Fixed default Initiative calculation not adding a character's current Initiative bonus.
- Fixed Armiger's Bonus Advances.
- Fixed an issue that would break Creature / NPC sheets when a Weapon was added and a custom Skill Compendium was in use in the World.
- Fixed a massive performance issue when adding new Professions to a Character (most noticeable for Forge users).

## [5.4.1] - 2024-12-03

Compatible Foundry version: 12.331

### Fixed

- Fixed localization for Active Effects

## [5.4.0] - 2024-12-02

Compatible Foundry version: 12.331

### Added

- Added basic support for Active Effects. Active Effects can currently target Primary Attributes, Primary Attribute Bonuses, Damage and Peril Thresholds, and Secondary Attributes (with the exception of Dodge and Parry).
- DTM value is now displayed under Damage Threshold on a Character sheet's Attributes tab.

### Fixed

- Adjusted many inconsistent CSS styles.
- Fixed incorrect Dodge and Parry values being displayed when using the alternate Peril system.
- Fixed global item search when using Flames of Freedom option

## [5.3.5] - 2024-10-25

Compatible Foundry version: 12.331

### Fixed

- Fix missing Compendium entries (Bestiary, GM Tables, Character Creation Tables, Macros).

## [5.3.4] - 2024-10-25

Compatible Foundry version: 12.331

### Added

- New workflow for extracting / compiling Compendium packs that uses LevelDB (does not impact users, merely technical)

### Fixed

- Fix Exploding Dice not working correctly. This update does not go through a world's Actors, so any PCs and NPCs that wield firearms will need to be manually updated (change `xd1,6` to `xd1&6` in the weapon damage formulas).

## [5.3.2] - 2024-09-12

Compatible Foundry version: 12

### Added

- Refactor actor sheet header

### Fixed

- Fix issue with localization due to performance optimization
- Fix issue with not being able to close ESC menu

## [5.3.0] - 2024-09-12

Compatible Foundry version: 12

### Added

- Support for FoundryVTT V12
- Vehicle Sheets with limited functionality

### Fixed

- Update deprecated Chat Commander integration
- Add missing Zweihänder drawbacks' descriptions and effects
- Fix numerous visual inconsistencies due to FoundryVTT CSS changes
- Fix Polyglot integration
- Improved the massive performance hit when adding Professions to an Actor

## [5.2.0] - 2023-07-22

Compatible Foundry version: 10-11

### Compatibility warning

Foundry 11 introduced significant changes to unlinked actors. We tried to
automatically upgrade existing tokens, but if you encounter issues with unlinked
actors in the scenes, you may have to recreate them in the scene (by dragging
replacements from compendium or actor's directory).

### Added

- Support for Foundry 11.
- Alternative Peril system.
- Simple currency exchange on Actor sheet.
- New trappings and rituals, including missing ones from Main Gauche

### Changed

- Show weapon information on attack roll in chat cards.

### Fixed

- Fix HTML and missing description in Item chat cards.
- Fix long Actor names on chat cards.
- Fix status effect names localization.
- Fix Drag Ruler integration.
- Fix import trappings macro.
