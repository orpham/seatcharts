import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SeatCharts} from '../src/SeatCharts';
import type {ISeat, SeatChartsOptions} from '../src/types';

let container: HTMLDivElement;

beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
});

function make(map: string[], options: Partial<Omit<SeatChartsOptions, 'map'>> = {}) {
    return new SeatCharts(container, {map, naming: {top: false, left: false}, ...options});
}

describe('rendering', () => {
    it('renders seats from map', () => {
        make(['aaa']);
        expect(container.querySelectorAll('.seatCharts-seat').length).toBe(3);
    });

    it('renders underscore as space', () => {
        make(['a_a']);
        expect(container.querySelectorAll('.seatCharts-seat').length).toBe(2);
        expect(container.querySelectorAll('.seatCharts-space').length).toBe(1);
    });

    it('renders a header row when naming.top is true', () => {
        new SeatCharts(container, {map: ['aaa'], naming: {top: true, left: false}});
        const header = container.querySelector('.seatCharts-header');
        expect(header).not.toBeNull();
        expect(header!.querySelectorAll('.seatCharts-cell').length).toBe(3);
    });

    it('renders left labels when naming.left is true', () => {
        new SeatCharts(container, {map: ['aaa'], naming: {top: false, left: true}});
        const firstRow = container.querySelector('.seatCharts-row:not(.seatCharts-header)');
        expect(firstRow?.querySelector('.seatCharts-space')).not.toBeNull();
    });

    it('marks the container and exposes accessibility attributes', () => {
        make(['a']);
        expect(container.classList.contains('seatCharts-container')).toBe(true);
        expect(container.getAttribute('tabindex')).toBe('0');

        const seat = container.querySelector('.seatCharts-seat')!;
        expect(seat.getAttribute('role')).toBe('checkbox');
        expect(seat.getAttribute('aria-checked')).toBe('false');
        expect(seat.getAttribute('tabindex')).toBe('-1');
    });

    it('applies custom classes from the seat setup', () => {
        make(['a'], {seats: {a: {classes: ['vip']}}});
        expect(container.querySelector('.seatCharts-seat')!.classList.contains('vip')).toBe(true);
    });
});

describe('naming & ids', () => {
    it('assigns default ids based on row and column', () => {
        make(['aa']);
        expect(container.querySelector('#\\31_1')).not.toBeNull();
        expect(document.getElementById('1_1')).not.toBeNull();
        expect(document.getElementById('1_2')).not.toBeNull();
    });

    it('supports custom id and label via bracket notation', () => {
        make(['a[myId,My Label]']);
        const seat = document.getElementById('myId');
        expect(seat).not.toBeNull();
        expect(seat?.textContent).toBe('My Label');
    });

    it('supports a custom id only via bracket notation', () => {
        make(['a[onlyId]']);
        expect(document.getElementById('onlyId')).not.toBeNull();
    });

    it('counts columns correctly with bracket notation', () => {
        new SeatCharts(container, {map: ['a[x,1]aa'], naming: {top: true, left: false}});
        // three seats → three header columns (regression: the bracket must not add a column)
        expect(container.querySelector('.seatCharts-header')!.querySelectorAll('.seatCharts-cell').length).toBe(3);
    });

    it('uses a custom getId function', () => {
        new SeatCharts(container, {
            map: ['aa'],
            naming: {top: false, left: false, getId: (c, r, col) => `seat-${r}-${col}`},
        });
        expect(document.getElementById('seat-1-1')).not.toBeNull();
        expect(document.getElementById('seat-1-2')).not.toBeNull();
    });

    it('uses custom row and column labels', () => {
        new SeatCharts(container, {
            map: ['aa'],
            naming: {top: true, left: true, rows: ['A'], columns: ['L', 'R']},
        });
        const header = container.querySelector('.seatCharts-header')!;
        const cells = header.querySelectorAll('.seatCharts-cell');
        // first cell is the empty corner (because left is enabled), then the two columns
        expect(cells[1].textContent).toBe('L');
        expect(cells[2].textContent).toBe('R');
    });
});

describe('status()', () => {
    it('returns available by default', () => {
        const sc = make(['a']);
        expect(sc.status('1_1')).toBe('available');
    });

    it('sets the status for a single seat', () => {
        const sc = make(['a']);
        sc.status('1_1', 'unavailable');
        expect(sc.status('1_1')).toBe('unavailable');
    });

    it('sets the status for multiple seats', () => {
        const sc = make(['aa']);
        sc.status(['1_1', '1_2'], 'selected');
        expect(sc.status('1_1')).toBe('selected');
        expect(sc.status('1_2')).toBe('selected');
    });

    it('reflects selected state in aria-checked', () => {
        const sc = make(['a']);
        sc.status('1_1', 'selected');
        expect(sc.get('1_1').node().getAttribute('aria-checked')).toBe('true');
    });
});

describe('seat methods', () => {
    it('exposes char, data and node', () => {
        const sc = make(['a'], {seats: {a: {data: {price: 10}}}});
        const seat = sc.get('1_1');
        expect(seat.char()).toBe('a');
        expect(seat.data()).toEqual({price: 10});
        expect(seat.node()).toBe(document.getElementById('1_1'));
    });

    it('style() returns and updates the visual style', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        expect(seat.style()).toBe('available');
        seat.style('selected');
        expect(seat.style()).toBe('selected');
        expect(seat.node().classList.contains('selected')).toBe(true);
        expect(seat.node().classList.contains('available')).toBe(false);
    });
});

describe('click() interaction', () => {
    it('toggles available → selected → available', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        expect(seat.click()).toBe('selected');
        expect(seat.status()).toBe('selected');
        expect(seat.click()).toBe('available');
        expect(seat.status()).toBe('available');
    });

    it('is triggered by a DOM click event', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.node().dispatchEvent(new MouseEvent('click', {bubbles: true}));
        expect(seat.status()).toBe('selected');
    });

    it('does nothing for an unavailable seat by default', () => {
        const sc = make(['a']);
        sc.status('1_1', 'unavailable');
        sc.get('1_1').click();
        expect(sc.status('1_1')).toBe('unavailable');
    });

    it('uses a seat-level click callback', () => {
        const click = vi.fn(function (this: ISeat) {
            return 'unavailable';
        });
        const sc = make(['a'], {seats: {a: {click}}});
        sc.get('1_1').click();
        expect(click).toHaveBeenCalledOnce();
        expect(sc.status('1_1')).toBe('unavailable');
    });

    it('uses a map-level click callback as fallback', () => {
        const click = vi.fn(function (this: ISeat) {
            return 'selected';
        });
        const sc = new SeatCharts(container, {map: ['a'], naming: {top: false, left: false}, click});
        sc.get('1_1').click();
        expect(click).toHaveBeenCalledOnce();
        expect(sc.status('1_1')).toBe('selected');
    });

    it('prefers the seat-level callback over the map-level one', () => {
        const seatClick = vi.fn(function (this: ISeat) {
            return 'unavailable';
        });
        const mapClick = vi.fn(function (this: ISeat) {
            return 'selected';
        });
        const sc = new SeatCharts(container, {
            map: ['a'],
            naming: {top: false, left: false},
            seats: {a: {click: seatClick}},
            click: mapClick,
        });
        sc.get('1_1').click();
        expect(seatClick).toHaveBeenCalledOnce();
        expect(mapClick).not.toHaveBeenCalled();
    });
});

describe('focus() / blur() interaction', () => {
    it('focus() applies the focused style to an available seat', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.focus();
        expect(seat.node().classList.contains('focused')).toBe(true);
        // focus is transient — the underlying status stays available
        expect(seat.status()).toBe('available');
    });

    it('blur() reverts the focused style back to the status', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.focus();
        seat.blur();
        expect(seat.node().classList.contains('focused')).toBe(false);
        expect(seat.node().classList.contains('available')).toBe(true);
    });

    it('focusing a seat blurs the previously focused one', () => {
        const sc = make(['aa']);
        const a = sc.get('1_1');
        const b = sc.get('1_2');
        a.focus();
        b.focus();
        expect(a.node().classList.contains('focused')).toBe(false);
        expect(b.node().classList.contains('focused')).toBe(true);
    });

    it('reacts to mouseenter and mouseleave', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.node().dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));
        expect(seat.node().classList.contains('focused')).toBe(true);
        seat.node().dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}));
        expect(seat.node().classList.contains('focused')).toBe(false);
    });

    it('keeps a selected seat selected when focused', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.status('selected');
        seat.focus();
        expect(seat.node().classList.contains('selected')).toBe(true);
    });
});

describe('keyboard interaction', () => {
    it('selects a seat with the space key', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        seat.node().dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}));
        expect(seat.status()).toBe('selected');
    });

    it('moves focus to the next seat with ArrowRight', () => {
        const sc = make(['aa']);
        const a = sc.get('1_1');
        const b = sc.get('1_2');
        a.focus();
        a.node().dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
        expect(b.node().classList.contains('focused')).toBe(true);
        expect(a.node().classList.contains('focused')).toBe(false);
    });

    it('wraps around to the first seat with ArrowRight on the last seat', () => {
        const sc = make(['aa']);
        const a = sc.get('1_1');
        const b = sc.get('1_2');
        b.focus();
        b.node().dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
        expect(a.node().classList.contains('focused')).toBe(true);
    });
});

describe('find()', () => {
    it('finds seats by status', () => {
        const sc = make(['aa']);
        sc.status('1_1', 'unavailable');
        expect(sc.find('available').length).toBe(1);
        expect(sc.find('unavailable').length).toBe(1);
    });

    it('finds seats by character', () => {
        const sc = make(['ab'], {seats: {a: {}, b: {}}});
        expect(sc.find('a').length).toBe(1);
        expect(sc.find('b').length).toBe(1);
    });

    it('finds seats by character and status', () => {
        const sc = make(['ab'], {seats: {a: {}, b: {}}});
        sc.status('1_1', 'unavailable');
        expect(sc.find('a.unavailable').length).toBe(1);
        expect(sc.find('a.available').length).toBe(0);
    });

    it('finds seats by regex', () => {
        const sc = make(['aa']);
        expect(sc.find(/^1_/).length).toBe(2);
    });

    it('find() on a set searches within that set only', () => {
        const sc = make(['ab'], {seats: {a: {}, b: {}}});
        // both seats are available, but only one of them is an 'a'
        const aSeats = sc.find('a');
        expect(aSeats.length).toBe(1);
        expect(aSeats.find('available').length).toBe(1); // not 2 (would be 2 if it searched globally)
    });
});

describe('each()', () => {
    it('iterates over all seats', () => {
        const sc = make(['aaa']);
        let count = 0;
        sc.each(() => {
            count++;
        });
        expect(count).toBe(3);
    });

    it('binds `this` to the seat', () => {
        const sc = make(['a']);
        const chars: string[] = [];
        sc.each(function () {
            chars.push(this.char());
        });
        expect(chars).toEqual(['a']);
    });

    it('stops when the callback returns false', () => {
        const sc = make(['aaa']);
        let count = 0;
        sc.each(() => {
            count++;
            return false;
        });
        expect(count).toBe(1);
    });
});

describe('get()', () => {
    it('returns a seat by id', () => {
        const sc = make(['a']);
        const seat = sc.get('1_1');
        expect(seat.char()).toBe('a');
        expect(seat.status()).toBe('available');
    });

    it('returns a seat set by ids', () => {
        const sc = make(['aa']);
        const set = sc.get(['1_1', '1_2']);
        expect(set.length).toBe(2);
    });

    it('sets the status on a whole set at once', () => {
        const sc = make(['aa']);
        sc.get(['1_1', '1_2']).status('selected');
        expect(sc.status('1_1')).toBe('selected');
        expect(sc.status('1_2')).toBe('selected');
    });
});

describe('legend', () => {
    it('renders a legend after the container when no node is given', () => {
        make(['a'], {legend: {items: [['a', 'available', 'Available']]}});
        expect(container.nextElementSibling?.classList.contains('seatCharts-legend')).toBe(true);
    });

    it('renders the legend into a given container node', () => {
        const legendNode = document.createElement('div');
        document.body.appendChild(legendNode);
        make(['a'], {legend: {node: legendNode, items: [['a', 'available', 'Available']]}});
        expect(legendNode.classList.contains('seatCharts-legend')).toBe(true);
        expect(legendNode.querySelector('.seatCharts-legendDescription')?.textContent).toBe('Available');
    });

    it('renders no legend when there are no items', () => {
        make(['a']);
        expect(document.querySelector('.seatCharts-legend')).toBeNull();
    });
});

describe('multiple charts', () => {
    it('keeps two charts on the same page independent', () => {
        const container2 = document.createElement('div');
        document.body.appendChild(container2);

        const sc1 = new SeatCharts(container, {map: ['aa'], naming: {top: false, left: false}});
        const sc2 = new SeatCharts(container2, {map: ['aa'], naming: {top: false, left: false}});

        sc1.status('1_1', 'selected');
        expect(sc1.status('1_1')).toBe('selected');
        expect(sc2.status('1_1')).toBe('available');
    });
});

describe('destroy()', () => {
    it('clears the container and removes its attributes', () => {
        const sc = make(['aa']);
        sc.destroy();
        expect(container.innerHTML).toBe('');
        expect(container.classList.contains('seatCharts-container')).toBe(false);
        expect(container.getAttribute('tabindex')).toBeNull();
    });

    it('is idempotent', () => {
        const sc = make(['a']);
        sc.destroy();
        expect(() => sc.destroy()).not.toThrow();
    });
});
