# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
