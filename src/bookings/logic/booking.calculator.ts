// src/bookings/logic/booking.calculator.ts

export const BookingCalculator = {
    IVA_PERCENT: 0.19,
    OWNER_FEE_PERCENT: 0.18,   // 18% comisión al owner
    TRAVELER_FEE_PERCENT: 0.15, // 15% fee al viajero (agregado al precio)
    GRACE_PERIOD_MS: 30 * 60 * 1000,
    ONE_DAY_MS: 24 * 60 * 60 * 1000,

    MIN_PRICES: {
        small: 3500,
        medium: 5000,
        large: 7000,
    },

    calculateDays(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();
        if (diffMs <= this.ONE_DAY_MS + this.GRACE_PERIOD_MS) return 1;
        return Math.ceil((diffMs - this.GRACE_PERIOD_MS) / this.ONE_DAY_MS);
    },

    calculatePrice(
        prices: { small: number; medium: number; large: number },
        items: { small: number; medium: number; large: number },
        days: number,
    ): number {
        const { small = 0, medium = 0, large = 0 } = items;
        const dailyRate =
            small * Number(prices.small) +
            medium * Number(prices.medium) +
            large * Number(prices.large);
        return this.round(dailyRate * days);
    },

    calculateFinancials(ownerPrice: number) {
        const travelerFee = this.round(ownerPrice * this.TRAVELER_FEE_PERCENT);
        const subtotal = this.round(ownerPrice + travelerFee);
        const vatIncluded = this.round(subtotal * this.IVA_PERCENT / (1 + this.IVA_PERCENT));
        const totalToPay = subtotal;
        const ownerFee = this.round(ownerPrice * this.OWNER_FEE_PERCENT);
        const ownerNet = this.round(ownerPrice - ownerFee);
        const kipGoGross = this.round(travelerFee + ownerFee);

        return {
            ownerPrice,
            travelerFee,
            subtotal,
            vatIncluded,
            totalToPay,
            ownerFee,
            ownerNet,
            kipGoGross,
        };
    },

    round(value: number): number {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    },

    formatByCurrency(amount: number, currency: string): number {
        if (currency === 'CLP') return Math.round(amount);
        return Number(amount.toFixed(2));
    }
};