module.exports = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      comment:
        'Las dependencias circulares vuelven impredecible la inicialización de los features.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-does-not-depend-on-features',
      comment: 'Core contiene infraestructura transversal y no debe conocer features de negocio.',
      severity: 'error',
      from: { path: '^src/app/core' },
      to: { path: '^src/app/features' },
    },
    {
      name: 'features-do-not-depend-on-app-shell',
      comment: 'Los features no deben acoplarse al root component ni a su configuración.',
      severity: 'error',
      from: { path: '^src/app/features' },
      to: { path: '^src/app/app(\\.config|\\.routes)?\\.ts$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|dist)(/|$)|\\.spec\\.ts$' },
    tsConfig: { fileName: 'tsconfig.app.json' },
  },
};
