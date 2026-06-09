import type {ISeat, SeatData, SeatSetup, SeatStatus} from './types';

interface SeatInternalSettings {
    id: string;
    label: string | number;
    row: number;
    column: number;
    character: string;
    status: SeatStatus;
    style: string;
    data: SeatData;
    classes: string[];
    $node: HTMLElement;
}

interface SeatEventHandlers {
    click: (seat: ISeat) => SeatStatus;
    focus: (seat: ISeat) => SeatStatus;
    blur: (seat: ISeat) => SeatStatus;
}

export class Seat implements ISeat {
    readonly settings: SeatInternalSettings;
    private readonly _onEvent: SeatEventHandlers;
    private readonly _i18n: { t: (key: string) => string };

    constructor(
        setup: { id: string; label: string | number; row: number; column: number; character: string },
        seatSetup: SeatSetup,
        onEvent: SeatEventHandlers,
        allSeats: Map<string, Seat>,
        container: HTMLElement,
        i18n: { t: (key: string) => string },
    ) {
        this._onEvent = onEvent;
        this._i18n = i18n;
        this.settings = {
            id: setup.id,
            label: setup.label,
            row: setup.row,
            column: setup.column,
            character: setup.character,
            status: 'available',
            style: 'available',
            data: seatSetup.price !== undefined ? {price: seatSetup.price, ...(seatSetup.data ?? {})} : (seatSetup.data ?? {}),
            classes: seatSetup.classes ?? [],
            $node: document.createElement('div'),
        };

        const node = this.settings.$node;
        const classes = ['seatCharts-seat', 'seatCharts-cell', 'available', ...this.settings.classes].join(' ');

        node.id = setup.id;
        node.setAttribute('role', 'checkbox');
        node.setAttribute('aria-checked', 'false');
        node.setAttribute('aria-label', `${setup.label} – ${i18n.t('available')}`);
        node.setAttribute('tabindex', '-1');
        node.className = classes;
        node.textContent = String(setup.label);

        node.addEventListener('click', () => this.click());
        node.addEventListener('mouseenter', () => this.focus());
        node.addEventListener('mouseleave', () => this.blur());
        node.addEventListener('keydown', (e) => this._onKeyDown(e, allSeats, container));
    }

    data(): SeatData {
        return this.settings.data;
    }

    char(): string {
        return this.settings.character;
    }

    node(): HTMLElement {
        return this.settings.$node;
    }

    style(): string;
    style(newStyle: string): string;
    style(newStyle?: string): string {
        if (newStyle === undefined) return this.settings.style;

        const oldStyle = this.settings.style;
        if (newStyle === oldStyle) return oldStyle;

        if (newStyle !== 'focused') {
            this.settings.status = newStyle;
        }

        this.settings.$node.setAttribute('aria-checked', String(newStyle === 'selected'));
        this.settings.$node.setAttribute('aria-label', `${this.settings.label} – ${this._i18n.t(newStyle)}`);
        this.settings.$node.classList.remove(oldStyle);
        this.settings.$node.classList.add(newStyle);
        this.settings.style = newStyle;

        return newStyle;
    }

    status(): SeatStatus;
    status(newStatus: SeatStatus): SeatStatus;
    status(newStatus?: SeatStatus): SeatStatus {
        if (newStatus === undefined) return this.settings.status;
        return this.style(newStatus);
    }

    click(): SeatStatus {
        return this._onEvent.click(this);
    }

    focus(): SeatStatus {
        return this._onEvent.focus(this);
    }

    blur(): SeatStatus {
        return this._onEvent.blur(this);
    }

    private _onKeyDown(e: KeyboardEvent, allSeats: Map<string, Seat>, container: HTMLElement): void {
        const node = this.settings.$node;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.click();
                break;

            case 'ArrowUp':
            case 'ArrowDown': {
                e.preventDefault();
                const rows = Array.from(container.querySelectorAll<HTMLElement>('.seatCharts-row:not(.seatCharts-header)'));
                const currentRow = node.closest<HTMLElement>('.seatCharts-row');
                if (!currentRow) break;

                const cellsInRow = Array.from(currentRow.querySelectorAll<HTMLElement>('.seatCharts-seat,.seatCharts-space'));
                const colIndex = cellsInRow.indexOf(node);

                const newSeat = this._findVertical(rows, currentRow, colIndex, e.key === 'ArrowUp', allSeats);
                newSeat?.focus();
                break;
            }

            case 'ArrowLeft':
            case 'ArrowRight': {
                e.preventDefault();
                const allSeatNodes = Array.from(container.querySelectorAll<HTMLElement>('.seatCharts-seat:not(.seatCharts-space)'));
                const idx = allSeatNodes.indexOf(node);
                let next: HTMLElement | undefined;

                if (e.key === 'ArrowLeft') {
                    next = idx === 0 ? allSeatNodes[allSeatNodes.length - 1] : allSeatNodes[idx - 1];
                } else {
                    next = idx === allSeatNodes.length - 1 ? allSeatNodes[0] : allSeatNodes[idx + 1];
                }

                if (next) allSeats.get(next.id)?.focus();
                break;
            }
        }
    }

    private _findVertical(
        rows: HTMLElement[],
        currentRow: HTMLElement,
        colIndex: number,
        goUp: boolean,
        allSeats: Map<string, Seat>,
        startRow: HTMLElement = currentRow,
    ): Seat | null {
        const rowIndex = rows.indexOf(currentRow);
        let nextIndex: number;

        if (goUp) {
            nextIndex = rowIndex === 0 ? rows.length - 1 : rowIndex - 1;
        } else {
            nextIndex = rowIndex === rows.length - 1 ? 0 : rowIndex + 1;
        }

        const nextRow = rows[nextIndex];
        // no row found, or we wrapped all the way back to the start (e.g. a column of only spaces)
        if (!nextRow || nextRow === startRow) return null;

        const cells = Array.from(nextRow.querySelectorAll<HTMLElement>('.seatCharts-seat,.seatCharts-space'));
        const cell = cells[colIndex];

        if (!cell) return null;
        if (cell.classList.contains('seatCharts-space')) {
            return this._findVertical(rows, nextRow, colIndex, goUp, allSeats, startRow);
        }

        return allSeats.get(cell.id) ?? null;
    }
}
