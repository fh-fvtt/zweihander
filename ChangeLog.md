# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).´

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
