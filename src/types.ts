export type SeatStatus = 'available' | 'unavailable' | 'selected' | string;

export interface SeatData {
    [key: string]: unknown;
}

export interface SeatSetup {
    classes?: string[];
    data?: SeatData;
    price?: number;
    click?: (this: ISeat) => SeatStatus;
    focus?: (this: ISeat) => SeatStatus;
    blur?: (this: ISeat) => SeatStatus;
}

export interface NamingOptions {
    top?: boolean;
    left?: boolean;
    rows?: (string | number)[];
    columns?: (string | number)[];
    getId?: (character: string, row: string | number, column: string | number) => string;
    getLabel?: (character: string, row: string | number, column: string | number) => string | number;
}

export type LegendItem = [character: string, cssClass: string, label: string];

export interface LegendOptions {
    node?: HTMLElement | null;
    items?: LegendItem[];
}

export interface SeatChartsOptions {
    map: string[];
    naming?: NamingOptions;
    seats?: Record<string, SeatSetup>;
    legend?: LegendOptions;
    click?: (this: ISeat) => SeatStatus;
    focus?: (this: ISeat) => SeatStatus;
    blur?: (this: ISeat) => SeatStatus;
    onChange?: (seat: ISeat, newStatus: SeatStatus) => void;
    i18n?: { t: (key: string) => string };
}

export interface ISeat {
    status(): SeatStatus;

    status(newStatus: SeatStatus): SeatStatus;

    style(): string;

    style(newStyle: string): string;

    node(): HTMLElement;

    data(): SeatData;

    char(): string;

    click(): SeatStatus;

    focus(): SeatStatus;

    blur(): SeatStatus;
}

export interface ISeatSet {
    readonly length: number;

    status(): SeatStatus;

    status(newStatus: SeatStatus): void;

    node(): NodeList | HTMLElement[];

    each(callback: (this: ISeat, id: string) => void | false): void;

    find(query: string | RegExp): ISeatSet;

    get(id: string): ISeat;

    get(ids: string[]): ISeatSet;

    push(id: string, seat: ISeat): void;
}

export interface ISeatCharts {
    status(id: string): SeatStatus;

    status(id: string, newStatus: SeatStatus): void;

    status(ids: string[], newStatus: SeatStatus): void;

    each(callback: (this: ISeat, id: string) => void | false): void;

    node(): HTMLElement[];

    find(query: string | RegExp): ISeatSet;

    get(id: string): ISeat;

    get(ids: string[]): ISeatSet;

    set(): ISeatSet;

    destroy(): void;
}
