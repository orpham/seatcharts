# seatcharts

[![CI](https://github.com/orpham/seatcharts/actions/workflows/ci.yml/badge.svg)](https://github.com/orpham/seatcharts/actions/workflows/ci.yml)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/@orpham/seatcharts/badge)](https://www.jsdelivr.com/package/npm/@orpham/seatcharts)

Interactive seat charts — no jQuery required.

A TypeScript rewrite of [jQuery-Seat-Charts](https://github.com/mateuszmarkowski/jQuery-Seat-Charts) with a modern
class-based API, full type declarations, and zero runtime dependencies.

## Installation

```bash
npm install @orpham/seatcharts
```

## Quick Start

```html
<div id="seat-map"></div>
<div id="legend"></div>
```

```typescript
import {SeatCharts} from '@orpham/seatcharts';

const sc = new SeatCharts(document.getElementById('seat-map')!, {
    map: [
        'aaaaaaaaaaaa',
        'aaaaaaaaaaaa',
        'bbbbbbbbbb__',
        'bbbbbbbbbb__',
        'bbbbbbbbbbbb',
        'cccccccccccc'
    ],
    seats: {
        a: {classes: ['front-seat'], price: 99.99},
        b: {price: 49.99},
        c: {price: 19.99}
    },
    legend: {
        node: document.getElementById('legend')!,
        items: [
            ['a', 'available', 'Front (€ 99.99)'],
            ['b', 'available', 'Middle (€ 49.99)'],
            ['c', 'available', 'Back (€ 19.99)'],
            ['a', 'unavailable', 'Unavailable'],
            ['a', 'selected', 'Your selection']
        ]
    },
    click() {
        if (this.status() === 'available') return 'selected';
        if (this.status() === 'selected') return 'available';
        return this.style();
    }
});

// mark already booked seats
sc.find('c.available').status('unavailable');

// read price of a seat
console.log('Seat 1_2 costs ' + sc.get('1_2').data().price);
```

### CDN (no bundler)

```html
<script src="https://cdn.jsdelivr.net/npm/@orpham/seatcharts/dist/seatcharts.umd.cjs"></script>
<script>
    const sc = new seatcharts.SeatCharts(container, options);
</script>
```

---

## Map

The `map` option is an array of strings where each string represents one row. Every character represents a seat type of
your choice — you can use any letter except `_`, which is reserved as a blank spacer:

```typescript
map: [
    'aaaaaa__DDDDD',
    'aaaaaa__aaaaa',
    'bbbbbb__bbbbb',
    'ccccccccccccc'
]
```

### Custom ID and label per seat

By default, each seat gets an id of `row_column` (e.g. `1_3`) and a label equal to its column number. You can override
both inline using square-bracket notation:

```typescript
map: [
    'a[myId,My Label]aa', // custom id and label
    'a[onlyId]aa', // custom id, default label
    'a[,Just a label]aa' // default id, custom label
]
```

IDs may contain letters, digits, and underscores. Labels may additionally contain spaces.

---

## Seat Setup

The `seats` option maps each character to a `SeatSetup` object:

| Property  | Type                          | Description                                        |
|-----------|-------------------------------|----------------------------------------------------|
| `classes` | `string[]`                    | Extra CSS classes added to every seat of this type |
| `data`    | `Record<string, unknown>`     | Arbitrary data attached to the seat (price, etc.)  |
| `price`   | `number`                      | Shorthand stored in `data.price`                   |
| `click`   | `(this: ISeat) => SeatStatus` | Per-character click handler (overrides global)     |
| `focus`   | `(this: ISeat) => SeatStatus` | Per-character focus handler (overrides global)     |
| `blur`    | `(this: ISeat) => SeatStatus` | Per-character blur handler (overrides global)      |

```typescript
seats: {
    v: {
        classes: ['vip'],
        price: 300,
        click() {
            if (this.status() === 'available') return 'selected';
            if (this.status() === 'selected') return 'available';
            return this.style();
        }
    },
    e: {
        classes: ['economy'],
        price: 50
    }
}
```

---

## Events

Three events drive every interaction — mouse, touch, and keyboard are unified behind the same handlers:

| Event   | Triggered by             |
|---------|--------------------------|
| `click` | Mouse click · Spacebar   |
| `focus` | Mouse enter · Arrow keys |
| `blur`  | Mouse leave · Arrow keys |

Each handler is called with `this` bound to the seat (`ISeat`) and must return the new seat status. You can define
handlers globally on the chart or per character in `seats` — the per-character handler takes precedence.

### Default handlers

```typescript
click() {
    if (this.status() === 'available') return 'selected';
    if (this.status() === 'selected') return 'available';
    return this.style(); // keep current visual state (e.g., unavailable)
}

focus() {
    if (this.status() === 'available') return 'focused';
    return this.style();
}

blur() {
    return this.status(); // revert to actual status
}
```

> **Note on `focused`:** `focused` is a visual-only style — it does not change the seat's underlying status. Calling
> `seat.status()` on a focused seat returns its real status (`available`, `selected`, etc.). Use `seat.style()` when you
> need the current visual state.

---

## Options

### Constructor

```typescript
new SeatCharts(container: HTMLElement, options: SeatChartsOptions)
```

### `map` *(required)*

`string[]` — Row definitions. See [Map](#map).

### `naming`

Controls row and column labels and ID generation.

| Property   | Type                                           | Default                      | Description                              |
|------------|------------------------------------------------|------------------------------|------------------------------------------|
| `top`      | `boolean`                                      | `true`                       | Show a column-header row above the map   |
| `left`     | `boolean`                                      | `true`                       | Show a row-label column left of the map  |
| `rows`     | `(string \| number)[]`                         | `[1, 2, 3, ...]`             | Row label for each row                   |
| `columns`  | `(string \| number)[]`                         | `[1, 2, 3, ...]`             | Column label for each column             |
| `getId`    | `(character, row, column) => string`           | `` `${row}_${column}` ``     | ID generator — also used as the DOM `id` |
| `getLabel` | `(character, row, column) => string \| number` | `(_c, _r, column) => column` | Label displayed inside the seat cell     |

```typescript
naming: {
    rows: ['A', 'B', 'C', 'D'],
    columns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    getId: (char, row, col) => `${row}${col}`,
    getLabel: (_char, row, col) => `${row}${col}`
}
```

### `seats`

`Record<string, SeatSetup>` — Per-character configuration. See [Seat Setup](#seat-setup).

### `legend`

| Property | Type                  | Description                                                                |
|----------|-----------------------|----------------------------------------------------------------------------|
| `node`   | `HTMLElement \| null` | Container for the legend. If omitted, a `<div>` is inserted after the map. |
| `items`  | `LegendItem[]`        | Array of `[character, cssClass, label]` tuples.                            |

```typescript
legend: {
    node: document.getElementById('legend')!,
    items: [
        ['a', 'available', 'Available'],
        ['a', 'unavailable', 'Unavailable'],
        ['a', 'selected', 'Selected']
    ]
}
```

### `click` / `focus` / `blur`

Global event handlers. See [Events](#events).

### `onChange`

```typescript
onChange?: (seat: ISeat, newStatus: SeatStatus) => void
```

Called after every click-triggered status change, with the seat and its new status already applied. Use this to react to
selections without needing to read state inside the `click` handler:

```typescript
onChange(seat, newStatus) {
    if (newStatus === 'selected') {
        cart.add(seat.data().price);
    } else {
        cart.remove(seat.data().price);
    }
}
```

### `i18n`

```typescript
i18n: {
    t: (key: string) => string
}
```

Translation function used for seat `aria-label` attributes. Use the bundled `createI18n` helper or wire in any i18n
library. See [i18n](#i18n).

---

## API

### `SeatCharts`

#### `status(id, newStatus?)` / `status(ids, newStatus)`

Read or update the status of one or more seats by ID:

```typescript
sc.status('1_3'); // 'available'
sc.status('1_3', 'unavailable'); // set one seat
sc.status(['1_3', '1_4'], 'unavailable'); // set multiple seats
```

#### `get(id)` / `get(ids)`

Retrieve a single `ISeat` or a `ISeatSet`:

```typescript
const seat = sc.get('1_3');
const set = sc.get(['1_3', '1_4']);
```

#### `find(query)`

Search the entire map. Returns an `ISeatSet`. See [Selectors](#selectors).

#### `each(callback)`

Iterate over every seat. Return `false` from the callback to break early:

```typescript
sc.each(function (id) {
    console.log(id, this.status());
});
```

#### `node()`

Returns an `HTMLElement[]` of every seat node in map order.

#### `destroy()`

Removes all DOM elements created by the chart and clears event listeners. The container is restored to its original
state.

```typescript
sc.destroy();
```

---

## Live Updates

Use `sc.status()` to reflect new bookings in real time — for example by polling an endpoint every few seconds:

```typescript
setInterval(async () => {
    const bookings: { seatId: string }[] = await fetch('/bookings').then(r => r.json());
    sc.status(bookings.map(b => b.seatId), 'unavailable');
}, 10_000);
```

---

## Selectors

`find()` and `get()` return an `ISeatSet` that exposes the same methods, so they can be chained:

```typescript
sc.find('a'); // all 'a' seats
sc.find('unavailable'); // all unavailable seats
sc.find('a.available'); // available 'a' seats
sc.find(/^2_/); // all seats in row 2 (regex on id)

sc.get(['1_2', '1_3']).find('available'); // available seats within a subset
```

### Set methods

| Method              | Description                                                         |
|---------------------|---------------------------------------------------------------------|
| `status()`          | Returns the status of the single seat in the set (length must be 1) |
| `status(newStatus)` | Sets the status of every seat in the set                            |
| `node()`            | Returns `HTMLElement[]` for every seat in the set                   |
| `each(callback)`    | Iterates the set; return `false` to break                           |
| `find(query)`       | Searches within the set (not the whole map)                         |
| `get(id\|ids)`      | Retrieves seat(s) within the set by ID                              |

---

## Seat Methods

Every `ISeat` instance exposes the following methods. Inside event handlers `this` is the seat.

| Method      | Signature                       | Description                                            |
|-------------|---------------------------------|--------------------------------------------------------|
| `status()`  | `() => SeatStatus`              | Returns the current seat status                        |
| `status(s)` | `(s: SeatStatus) => SeatStatus` | Sets a new status and returns it                       |
| `style()`   | `() => string`                  | Returns the current visual style (may be `'focused'`)  |
| `style(s)`  | `(s: string) => string`         | Sets the visual style without touching the status      |
| `node()`    | `() => HTMLElement`             | Returns the seat's DOM element                         |
| `data()`    | `() => SeatData`                | Returns the arbitrary data object attached to the seat |
| `char()`    | `() => string`                  | Returns the seat's map character                       |
| `click()`   | `() => SeatStatus`              | Programmatically fires the click handler               |
| `focus()`   | `() => SeatStatus`              | Programmatically fires the focus handler               |
| `blur()`    | `() => SeatStatus`              | Programmatically fires the blur handler                |

### Seat statuses

| Status        | Meaning                                    |
|---------------|--------------------------------------------|
| `available`   | Seat can be selected by the user           |
| `unavailable` | Seat is already taken or blocked           |
| `selected`    | Seat has been selected by the current user |
| `focused`     | Visual-only hover/keyboard focus style     |

You can also return any custom string from an event handler to use your own status / style.

---

## Styling

The library generates plain HTML with predictable CSS classes — no styles are bundled, so you have full control.

| Class                           | Element                                           |
|---------------------------------|---------------------------------------------------|
| `.seatCharts-container`         | The root container element                        |
| `.seatCharts-row`               | Each row `<div>`                                  |
| `.seatCharts-header`            | The column-header row (when `naming.top` is true) |
| `.seatCharts-cell`              | Every cell — seats, spacers, and header cells     |
| `.seatCharts-seat`              | Seat cells only                                   |
| `.seatCharts-space`             | Spacer cells (`_` in the map)                     |
| `.seatCharts-seat.available`    | Available seats                                   |
| `.seatCharts-seat.selected`     | Selected seats                                    |
| `.seatCharts-seat.unavailable`  | Unavailable seats                                 |
| `.seatCharts-seat.focused`      | Focused seats (hover / keyboard)                  |
| `.seatCharts-legend`            | The legend container                              |
| `.seatCharts-legendList`        | The `<ul>` inside the legend                      |
| `.seatCharts-legendItem`        | Each `<li>` in the legend                         |
| `.seatCharts-legendDescription` | The text label next to each legend icon           |

To style seat types differently, combine the status class with your custom class:

```css
/* vip seats */
.seatCharts-seat.available.vip {
    background: #ffd700;
}

.seatCharts-seat.selected.vip {
    background: #ff8c00;
}

.seatCharts-seat.focused.vip {
    background: #ffe680;
}

.seatCharts-seat.unavailable.vip {
    background: #ccc;
}

/* economy seats */
.seatCharts-seat.available.economy {
    background: #90ee90;
}

.seatCharts-seat.selected.economy {
    background: #228b22;
}
```

```typescript
seats: {
    v: {
        classes: ['vip'],
        price: 300
    },
    e: {
        classes: ['economy'],
        price: 50
    }
}
```

---

## i18n

The library uses translation keys for seat `aria-label` attributes, making the chart fully accessible in any language.

| Key           | Default (fallback to key) | Usage                             |
|---------------|---------------------------|-----------------------------------|
| `available`   | `"available"`             | `aria-label` of available seats   |
| `unavailable` | `"unavailable"`           | `aria-label` of unavailable seats |
| `selected`    | `"selected"`              | `aria-label` of selected seats    |
| `focused`     | `"focused"`               | `aria-label` of focused seats     |

Use the bundled `createI18n` helper with one of the included locale files:

```typescript
import {SeatCharts, createI18n} from '@orpham/seatcharts';
import de from '@orpham/seatcharts/locales/de.json';

const sc = new SeatCharts(container, {
    map: ['aaa'],
    i18n: createI18n(de)
});
```

Available locales: `cs`, `de`, `el`, `en`, `es`, `fr`, `it`, `nl`, `no`, `pl`, `pt`, `sk`, `tr`.

You can also wire in any i18n library directly:

```typescript
import i18next from 'i18next';

const sc = new SeatCharts(container, {
    map: ['aaa'],
    i18n: {t: (key) => i18next.t(key)}
});
```

---

## Build

```bash
npm run build # produces dist/seatcharts.js and dist/seatcharts.umd.cjs
```

## Test

```bash
npm test # run once
npm run test:watch # watch mode
```

## License

MIT — see [LICENSE.txt](LICENSE.txt). Based
on [jQuery-Seat-Charts](https://github.com/mateuszmarkowski/jQuery-Seat-Charts) by Mateusz Markowski —
see [NOTICE](NOTICE).
