# Changelog

All notable changes to this project will be documented in this file. The format is based
on [Keep a Changelog](https://keepachangelog.com).

## [1.0.3] - 2026-06-11

Fix several typos.

## [1.0.2] - 2026-06-10

Initial automated npm release via GitHub Actions Trusted Publisher.

## [1.0.1] - 2026-06-10

Initial manual npm release.

## [1.0.0] - 2026-06-10

Complete rewrite of [jQuery-Seat-Charts](https://github.com/mateuszmarkowski/jQuery-Seat-Charts) by Mateusz Markowski.

### Added

- TypeScript rewrite with full type declarations
- Class-based API: `new SeatCharts(container, options)`
- `ISeatCharts`, `ISeat`, and `ISeatSet` interfaces for typed consumers
- `createI18n()` helper for plain-object translations
- `onChange` callback — fired after every click-triggered status change with the new status already applied
- `i18n` option — translation keys used for seat `aria-label` attributes
- Locale files: `cs`, `de`, `el`, `en`, `es`, `fr`, `it`, `nl`, `no`, `pl`, `pt`, `sk`, `tr`
- Inline bracket notation for per-seat ID and label overrides (`a[myId,My Label]`)
- Full keyboard navigation: Arrow keys to move focus, Spacebar to select
- `destroy()` method to cleanly remove the chart and its event listeners
- Legend rendering into a custom node or auto-inserted `<div>`
- Per-character event handlers in `seats` (override global `click`/`focus`/`blur`)
- `SeatSet` returned by `find()` and `get([…])` with chainable selectors

### Changed

- Removed jQuery dependency — vanilla JS only
- Removed `bower.json` and Grunt build in favor of Vite + Vitest
- `node()` now returns `HTMLElement[]` instead of a jQuery object
- `legend.node` now accepts `HTMLElement | null` instead of a jQuery selector

### Removed

- jQuery plugin interface (`$.fn.seatCharts`) — replaced by `new SeatCharts(container, options)`
- `animate` option — required jQuery UI, has no vanilla equivalent
