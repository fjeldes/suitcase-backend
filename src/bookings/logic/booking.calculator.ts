// src/bookings/logic/booking.calculator.ts

export const BookingCalculator = {
    // --- Configuración de negocio ---
    IVA_PERCENT: 0.19,         // 19% IVA (Chile)
    SERVICE_FEE_PERCENT: 0.15,  // 15% Comisión de la App
    GRACE_PERIOD_MS: 30 * 60 * 1000,
    ONE_DAY_MS: 24 * 60 * 60 * 1000,

    /**
     * 1. Calcula la cantidad de días a cobrar.
     */
    calculateDays(start: Date, end: Date): number {
        const diffMs = end.getTime() - start.getTime();

        if (diffMs <= this.ONE_DAY_MS + this.GRACE_PERIOD_MS) {
            return 1;
        }

        const effectiveMs = diffMs - this.GRACE_PERIOD_MS;
        return Math.ceil(effectiveMs / this.ONE_DAY_MS);
    },

    /**
     * 2. Calcula el precio total (PVP) que verá el cliente.
     */
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

        const total = dailyRate * days;

        return this.round(total);
    },

    /**
     * 3. Desglosa el pago total en IVA, Comisión y Neto para el Owner.
     */
    calculateFinancials(totalPrice: number) {
        const baseImponible = this.round(totalPrice / (1 + this.IVA_PERCENT));
        const taxAmount = this.round(totalPrice - baseImponible);
        const serviceFee = this.round(baseImponible * this.SERVICE_FEE_PERCENT);
        const ownerNet = this.round(baseImponible - serviceFee);

        return {
            totalAmount: totalPrice,
            taxAmount,
            serviceFee,
            ownerNet,
        };
    },

    /**
     * Utility para evitar errores de precisión de punto flotante.
     * (Nota: Quitamos 'private' porque es un objeto, no una clase)
     */
    round(value: number): number {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    },

    formatByCurrency(amount: number, currency: string): number {
        if (currency === 'CLP') {
            return Math.round(amount); // En Chile siempre redondeamos al entero
        }
        return Number(amount.toFixed(2)); // Para el resto, 2 decimales
    }
};