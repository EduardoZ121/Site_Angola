(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [38, 74, 345, 352, 667],
  {
    3417: (e, t, r) => {
      'use strict';
      r.d(t, { cn: () => l });
      var s = r(6744),
        n = r(4800);
      function l() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++) t[r] = arguments[r];
        return (0, n.QP)((0, s.$)(t));
      }
    },
    3940: (e, t, r) => {
      'use strict';
      r.d(t, { Tooltip: () => o });
      var s = r(6458),
        n = r(5122),
        l = r(3417);
      function o(e) {
        let { content: t, children: r, className: o, ...a } = e,
          i = (0, n.useId)(),
          [u, c] = (0, n.useState)(!1);
        return (0, s.jsxs)('span', {
          className: (0, l.cn)('relative inline-flex', o),
          onMouseEnter: () => c(!0),
          onMouseLeave: () => c(!1),
          onFocus: () => c(!0),
          onBlur: () => c(!1),
          ...a,
          children: [
            (0, s.jsx)('span', { 'aria-describedby': u ? i : void 0, children: r }),
            u
              ? (0, s.jsx)('span', {
                  id: i,
                  role: 'tooltip',
                  className:
                    'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-kuteka bg-slate-900 px-2 py-1 text-xs text-white shadow-sm',
                  children: t,
                })
              : null,
          ],
        });
      }
    },
    6512: (e, t, r) => {
      (Promise.resolve().then(r.t.bind(r, 1614, 23)),
        Promise.resolve().then(r.bind(r, 3940)),
        Promise.resolve().then(r.bind(r, 8694)));
    },
    8694: (e, t, r) => {
      'use strict';
      r.d(t, { ThemeProvider: () => a, useTheme: () => i });
      var s = r(6458),
        n = r(5122);
      let l = (0, n.createContext)(null),
        o = 'kuteka-theme';
      function a(e) {
        let { children: t } = e,
          [r, a] = (0, n.useState)('light'),
          [i, u] = (0, n.useState)(!1);
        ((0, n.useEffect)(() => {
          (a(
            (function () {
              let e = window.localStorage.getItem(o);
              return 'light' === e || 'dark' === e
                ? e
                : window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? 'dark'
                  : 'light';
            })(),
          ),
            u(!0));
        }, []),
          (0, n.useEffect)(() => {
            i &&
              (document.documentElement.classList.toggle('dark', 'dark' === r),
              window.localStorage.setItem(o, r));
          }, [r, i]));
        let c = (0, n.useCallback)((e) => {
            a(e);
          }, []),
          d = (0, n.useCallback)(() => {
            a((e) => ('light' === e ? 'dark' : 'light'));
          }, []),
          h = (0, n.useMemo)(() => ({ theme: r, setTheme: c, toggleTheme: d }), [r, c, d]);
        return (0, s.jsx)(l.Provider, { value: h, children: t });
      }
      function i() {
        let e = (0, n.useContext)(l);
        if (!e) throw Error('useTheme must be used within ThemeProvider');
        return e;
      }
    },
  },
  (e) => {
    (e.O(0, [573, 614, 387, 120, 358], () => e((e.s = 6512))), (_N_E = e.O()));
  },
]);
