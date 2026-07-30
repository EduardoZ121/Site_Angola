(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [39],
  {
    7806: (e, r, n) => {
      Promise.resolve().then(n.bind(n, 9645));
    },
    9645: (e, r, n) => {
      'use strict';
      (n.r(r), n.d(r, { default: () => i }));
      var s = n(6458),
        a = n(8903),
        l = n(5122),
        t = n(4993);
      function i(e) {
        let { error: r, reset: n } = e;
        return (
          (0, l.useEffect)(() => {
            t.v.error('Route error', { digest: r.digest, name: r.name });
          }, [r]),
          (0, s.jsxs)('main', {
            className: 'mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6',
            children: [
              (0, s.jsx)(a.DZ, { level: 1, children: 'Erro' }),
              (0, s.jsx)(a.EY, { children: 'N\xe3o foi poss\xedvel carregar esta p\xe1gina.' }),
              (0, s.jsx)(a.$n, { onClick: n, children: 'Tentar novamente' }),
            ],
          })
        );
      }
    },
  },
  (e) => {
    (e.O(0, [573, 751, 387, 120, 358], () => e((e.s = 7806))), (_N_E = e.O()));
  },
]);
