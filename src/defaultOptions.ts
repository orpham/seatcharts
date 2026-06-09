import type {SeatChartsOptions, SeatStatus} from './types';
import type {ISeat} from './types';

const defaultI18n = {t: (key: string) => key};

export const defaultOptions: Omit<Required<SeatChartsOptions>, 'map'> = {
    naming: {
        top: true,
        left: true,
        getId: (character, row, column) => `${row}_${column}`,
        getLabel: (_character, _row, column) => column,
    },
    seats: {},
    legend: {
        node: null,
        items: [],
    },
    click(this: ISeat): SeatStatus {
        if (this.status() === 'available') return 'selected';
        if (this.status() === 'selected') return 'available';
        return this.style();
    },
    focus(this: ISeat): SeatStatus {
        if (this.status() === 'available') return 'focused';
        return this.style();
    },
    blur(this: ISeat): SeatStatus {
        return this.status();
    },
    onChange: () => {
    },
    i18n: defaultI18n,
};
