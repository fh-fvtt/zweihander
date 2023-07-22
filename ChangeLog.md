# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0] - {{RELEASE_DATE}}
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
