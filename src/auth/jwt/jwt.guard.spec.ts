import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});
