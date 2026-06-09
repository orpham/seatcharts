import {Seat} from './Seat';
import {defaultOptions} from './defaultOptions';
import type {ISeat, ISeatCharts, ISeatSet, LegendItem, SeatChartsOptions, SeatStatus} from './types';

const SEAT_PATTERN = /[a-z_]{1}(\[[0-9a-z_]{0,}(,[0-9a-z_ ]+)?\])?/gi;

function matchesQuery(seat: ISeat, id: string, query: string | RegExp): boolean {
    if (query instanceof RegExp) return id.match(query) !== null;
    if (query.length === 1) return seat.char() === query;
    if (query.includes('.')) {
        const [char, status] = query.split('.');
        return seat.char() === char && seat.status() === status;
    }
    return seat.status() === query;
}

class SeatSet implements ISeatSet {
    readonly seats: ISeat[] = [];
    readonly seatIds: string[] = [];
    length = 0;

    constructor(private readonly _sc: SeatCharts) {
    }

    status(): SeatStatus;
    status(newStatus: SeatStatus): void;
    status(newStatus?: SeatStatus): SeatStatus | void {
        if (this.length === 1 && newStatus === undefined) return this.seats[0].status();
        for (const seat of this.seats) seat.status(newStatus!);
    }

    node(): HTMLElement[] {
        return this.seats.map(seat => seat.node());
    }

    each(callback: (this: ISeat, id: string) => void | false): void {
        for (let i = 0; i < this.seatIds.length; i++) {
            if (callback.call(this.seats[i], this.seatIds[i]) === false) break;
        }
    }

    find(query: string | RegExp): ISeatSet {
        const result = this._sc.set();
        this.each(function (id) {
            if (matchesQuery(this, id, query)) result.push(id, this);
        });
        return result;
    }

    get(id: string): ISeat;
    get(ids: string[]): ISeatSet;
    get(idOrIds: string | string[]): ISeat | ISeatSet {
        return this._sc.get(idOrIds as string);
    }

    set(): ISeatSet {
        return this._sc.set();
    }

    push(id: string, seat: ISeat): void {
        this.seats.push(seat);
        this.seatIds.push(id);
        this.length++;
    }
}

export class SeatCharts implements ISeatCharts {
    private readonly _container: HTMLElement;
    private readonly _seats: Map<string, Seat> = new Map();
    private readonly _seatIds: string[] = [];
    private _destroyed = false;

    constructor(container: HTMLElement, options: SeatChartsOptions) {
        this._container = container;

        const opts = this._mergeOptions(options);
        this._container.classList.add('seatCharts-container');
        this._container.setAttribute('tabindex', '0');

        const naming = opts.naming;
        const map = opts.map;

        naming.rows = naming.rows ?? Array.from({length: map.length}, (_, i) => i + 1);
        naming.columns = naming.columns ?? Array.from({length: (map[0].match(SEAT_PATTERN) ?? []).length}, (_, i) => i + 1);

        if (naming.top) {
            const headerRow = document.createElement('div');
            headerRow.className = 'seatCharts-row seatCharts-header';

            if (naming.left) {
                headerRow.appendChild(this._cell(''));
            }

            for (const col of naming.columns) {
                headerRow.appendChild(this._cell(String(col)));
            }

            this._container.appendChild(headerRow);
        }

        for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'seatCharts-row';

            if (naming.left) {
                const labelCell = this._cell(String(naming.rows[rowIdx]));
                labelCell.classList.add('seatCharts-space');
                rowEl.appendChild(labelCell);
            }

            const characters = map[rowIdx].match(SEAT_PATTERN) ?? [];
            let colIdx = 0;

            for (const characterParams of characters) {
                const matches = characterParams.match(/([a-z_]{1})(\[([0-9a-z_ ,]+)\])?/i);
                if (!matches) {
                    colIdx++;
                    continue;
                }

                const character = matches[1];
                const params = matches[3] ? matches[3].split(',') : [];
                const overrideId = params[0] || null;
                const overrideLabel = params.length === 2 ? params[1] : null;

                if (character === '_') {
                    const space = document.createElement('div');
                    space.className = 'seatCharts-cell seatCharts-space';
                    rowEl.appendChild(space);
                } else {
                    if (!opts.seats[character]) opts.seats[character] = {};

                    const seatSetup = opts.seats[character];
                    const getId = naming.getId!;
                    const getLabel = naming.getLabel!;
                    const row = naming.rows![rowIdx];
                    const col = naming.columns![colIdx];

                    const id = overrideId ?? getId(character, row, col);
                    const label = overrideLabel ?? getLabel(character, row, col);

                    const seat = new Seat(
                        {id, label, row: rowIdx, column: colIdx, character},
                        seatSetup,
                        {
                            click: (s) => {
                                const cb = seatSetup.click ?? opts.click;
                                const newStatus = s.style(cb.call(s));
                                opts.onChange?.(s, newStatus);
                                return newStatus;
                            },
                            focus: (s) => {
                                const activeSeatId = this._container.getAttribute('aria-activedescendant');
                                if (activeSeatId) this._seats.get(activeSeatId)?.blur();
                                this._container.setAttribute('aria-activedescendant', id);
                                s.node().focus();
                                const cb = seatSetup.focus ?? opts.focus;
                                return s.style(cb.call(s));
                            },
                            blur: (s) => {
                                const cb = seatSetup.blur ?? opts.blur;
                                return s.style(cb.call(s));
                            },
                        },
                        this._seats,
                        this._container,
                        opts.i18n,
                    );

                    this._seats.set(id, seat);
                    this._seatIds.push(id);
                    rowEl.appendChild(seat.node());
                }

                colIdx++;
            }

            this._container.appendChild(rowEl);
        }

        if (opts.legend.items && opts.legend.items.length > 0) {
            this._renderLegend(opts.legend.items, opts.legend.node ?? null, opts.seats);
        }

        this._container.addEventListener('focus', () => {
            const activeSeatId = this._container.getAttribute('aria-activedescendant');
            if (activeSeatId) this._seats.get(activeSeatId)?.blur();

            const firstSeat = this._seats.get(this._seatIds[0]);
            if (firstSeat) {
                this._container.setAttribute('aria-activedescendant', this._seatIds[0]);
                firstSeat.node().focus();
                firstSeat.focus();
            }
        });
    }

    status(id: string): SeatStatus;
    status(id: string, newStatus: SeatStatus): void;
    status(ids: string[], newStatus: SeatStatus): void;
    status(...args: unknown[]): SeatStatus | void {
        if (args.length === 1 && typeof args[0] === 'string') {
            return this._seats.get(args[0])!.status();
        }
        if (typeof args[0] === 'string') {
            this._seats.get(args[0] as string)!.status(args[1] as SeatStatus);
        } else {
            for (const id of args[0] as string[]) {
                this._seats.get(id)!.status(args[1] as SeatStatus);
            }
        }
    }

    each(callback: (this: ISeat, id: string) => void | false): void {
        for (const [id, seat] of this._seats) {
            if (callback.call(seat, id) === false) break;
        }
    }

    node(): HTMLElement[] {
        return this._seatIds.map(id => this._seats.get(id)!.node());
    }

    find(query: string | RegExp): ISeatSet {
        const result = this.set();
        this.each(function (id) {
            if (matchesQuery(this, id, query)) result.push(id, this);
        });
        return result;
    }

    get(id: string): ISeat;
    get(ids: string[]): ISeatSet;
    get(idOrIds: string | string[]): ISeat | ISeatSet {
        if (typeof idOrIds === 'string') {
            return this._seats.get(idOrIds)!;
        }
        const result = this.set();
        for (const id of idOrIds) {
            const seat = this._seats.get(id);
            if (seat) result.push(id, seat);
        }
        return result;
    }

    set(): ISeatSet {
        return new SeatSet(this);
    }

    destroy(): void {
        if (this._destroyed) return;
        this._container.innerHTML = '';
        this._container.classList.remove('seatCharts-container');
        this._container.removeAttribute('tabindex');
        this._container.removeAttribute('aria-activedescendant');
        this._seats.clear();
        this._seatIds.length = 0;
        this._destroyed = true;
    }

    private _cell(text: string): HTMLElement {
        const el = document.createElement('div');
        el.className = 'seatCharts-cell';
        el.textContent = text;
        return el;
    }

    private _renderLegend(
        items: LegendItem[],
        node: HTMLElement | null,
        seats: SeatChartsOptions['seats'],
    ): void {
        const container = node ?? document.createElement('div');
        if (!node) this._container.insertAdjacentElement('afterend', container);
        container.classList.add('seatCharts-legend');

        const ul = document.createElement('ul');
        ul.className = 'seatCharts-legendList';

        for (const [character, cssClass, label] of items) {
            const li = document.createElement('li');
            li.className = 'seatCharts-legendItem';

            const icon = document.createElement('div');
            const extraClasses = seats?.[character]?.classes ?? [];
            icon.className = ['seatCharts-seat', 'seatCharts-cell', cssClass, ...extraClasses].join(' ');

            const span = document.createElement('span');
            span.className = 'seatCharts-legendDescription';
            span.textContent = label;

            li.appendChild(icon);
            li.appendChild(span);
            ul.appendChild(li);
        }

        container.appendChild(ul);
    }

    private _mergeOptions(options: SeatChartsOptions): Required<SeatChartsOptions> {
        return {
            map: options.map,
            naming: {...defaultOptions.naming, ...options.naming},
            seats: {...defaultOptions.seats, ...options.seats},
            legend: {...defaultOptions.legend, ...options.legend},
            click: options.click ?? defaultOptions.click,
            focus: options.focus ?? defaultOptions.focus,
            blur: options.blur ?? defaultOptions.blur,
            onChange: options.onChange ?? defaultOptions.onChange,
            i18n: options.i18n ?? defaultOptions.i18n,
        };
    }
}
