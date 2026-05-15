import { BookingCalculator } from './booking.calculator'

describe('BookingCalculator', () => {
  describe('calculateDays', () => {
    it('returns 1 for same-day booking', () => {
      const start = new Date('2025-06-01T10:00:00')
      const end = new Date('2025-06-01T14:00:00')
      expect(BookingCalculator.calculateDays(start, end)).toBe(1)
    })

    it('returns 1 for booking within 24h + grace period', () => {
      const start = new Date('2025-06-01T10:00:00')
      const end = new Date('2025-06-02T10:29:59')
      expect(BookingCalculator.calculateDays(start, end)).toBe(1)
    })

    it('returns 2 for just over 24h + grace period', () => {
      const start = new Date('2025-06-01T10:00:00')
      const end = new Date('2025-06-02T10:31:00')
      expect(BookingCalculator.calculateDays(start, end)).toBe(2)
    })

    it('returns 3 for multi-day booking', () => {
      const start = new Date('2025-06-01T10:00:00')
      const end = new Date('2025-06-04T10:00:00')
      expect(BookingCalculator.calculateDays(start, end)).toBe(3)
    })

    it('works across month boundary', () => {
      const start = new Date('2025-06-30T10:00:00')
      const end = new Date('2025-07-02T10:00:00')
      expect(BookingCalculator.calculateDays(start, end)).toBe(2)
    })
  })

  describe('calculatePrice', () => {
    const prices = { small: 5, medium: 8, large: 12 }

    it('calculates price for one small item for 1 day', () => {
      expect(BookingCalculator.calculatePrice(prices, { small: 1, medium: 0, large: 0 }, 1)).toBe(5)
    })

    it('calculates price for mixed items for multiple days', () => {
      expect(BookingCalculator.calculatePrice(prices, { small: 2, medium: 1, large: 1 }, 3)).toBe(90)
    })

    it('returns 0 for zero items', () => {
      expect(BookingCalculator.calculatePrice(prices, { small: 0, medium: 0, large: 0 }, 5)).toBe(0)
    })

    it('handles missing item keys as 0', () => {
      expect(BookingCalculator.calculatePrice(prices, {} as any, 2)).toBe(0)
    })
  })

  describe('calculateFinancials', () => {
    it('calculates IVA, service fee, and owner net correctly', () => {
      const result = BookingCalculator.calculateFinancials(100)
      expect(result.totalAmount).toBe(100)
      expect(result.taxAmount).toBeCloseTo(15.97, 1)
      expect(result.serviceFee).toBeCloseTo(12.61, 1)
      expect(result.ownerNet).toBeCloseTo(71.42, 1)
    })

    it('handles zero amount', () => {
      const result = BookingCalculator.calculateFinancials(0)
      expect(result.totalAmount).toBe(0)
      expect(result.taxAmount).toBe(0)
      expect(result.serviceFee).toBe(0)
      expect(result.ownerNet).toBe(0)
    })

    it('sum of parts equals total (approximately)', () => {
      const result = BookingCalculator.calculateFinancials(119)
      const sum = result.taxAmount + result.serviceFee + result.ownerNet
      expect(Math.abs(sum - result.totalAmount)).toBeLessThan(0.1)
    })
  })

  describe('round', () => {
    it('rounds to 2 decimal places', () => {
      expect(BookingCalculator.round(10.456)).toBe(10.46)
    })

    it('handles integer', () => {
      expect(BookingCalculator.round(10)).toBe(10)
    })

    it('handles .99 repeating', () => {
      expect(BookingCalculator.round(10.999)).toBe(11)
    })
  })

  describe('formatByCurrency', () => {
    it('rounds to integer for CLP', () => {
      expect(BookingCalculator.formatByCurrency(1234.56, 'CLP')).toBe(1235)
    })

    it('keeps 2 decimals for USD', () => {
      expect(BookingCalculator.formatByCurrency(1234.56, 'USD')).toBe(1234.56)
    })

    it('handles integer amount for CLP', () => {
      expect(BookingCalculator.formatByCurrency(1000, 'CLP')).toBe(1000)
    })
  })
})
