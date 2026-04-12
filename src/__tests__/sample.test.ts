describe('Sample Test Suite', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('hello world').toContain('world');
  });

  it('should work with arrays', () => {
    const items = [1, 2, 3];
    expect(items).toHaveLength(3);
    expect(items).toContain(2);
  });
});
