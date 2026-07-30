(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [522],
  {
    3417: (e, t, a) => {
      'use strict';
      a.d(t, { cn: () => i });
      var r = a(6744),
        s = a(4800);
      function i() {
        for (var e = arguments.length, t = Array(e), a = 0; a < e; a++) t[a] = arguments[a];
        return (0, s.QP)((0, r.$)(t));
      }
    },
    3940: (e, t, a) => {
      'use strict';
      a.d(t, { Tooltip: () => n });
      var r = a(6458),
        s = a(5122),
        i = a(3417);
      function n(e) {
        let { content: t, children: a, className: n, ...o } = e,
          l = (0, s.useId)(),
          [d, c] = (0, s.useState)(!1);
        return (0, r.jsxs)('span', {
          className: (0, i.cn)('relative inline-flex', n),
          onMouseEnter: () => c(!0),
          onMouseLeave: () => c(!1),
          onFocus: () => c(!0),
          onBlur: () => c(!1),
          ...o,
          children: [
            (0, r.jsx)('span', { 'aria-describedby': d ? l : void 0, children: a }),
            d
              ? (0, r.jsx)('span', {
                  id: l,
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
    4349: (e, t, a) => {
      'use strict';
      (a.r(t), a.d(t, { Reveal: () => n }));
      var r = a(6458),
        s = a(3417),
        i = a(5122);
      function n(e) {
        let { children: t, className: a, delayMs: n = 0 } = e,
          o = (0, i.useRef)(null),
          [l, d] = (0, i.useState)(!1);
        return (
          (0, i.useEffect)(() => {
            let e = o.current;
            if (!e) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return void d(!0);
            let t = () => d(!0);
            if (e.getBoundingClientRect().top < 0.92 * window.innerHeight) return void t();
            let a = new IntersectionObserver(
              (e) => {
                let [r] = e;
                (null == r ? void 0 : r.isIntersecting) && (t(), a.disconnect());
              },
              { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
            );
            a.observe(e);
            let r = window.setTimeout(t, 1200);
            return () => {
              (a.disconnect(), window.clearTimeout(r));
            };
          }, []),
          (0, r.jsx)('div', {
            ref: o,
            className: (0, s.cn)(
              'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
              l ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
              a,
            ),
            style: l && n > 0 ? { transitionDelay: ''.concat(n, 'ms') } : void 0,
            children: t,
          })
        );
      }
    },
    6027: (e, t, a) => {
      (Promise.resolve().then(a.bind(a, 9482)),
        Promise.resolve().then(a.bind(a, 4349)),
        Promise.resolve().then(a.t.bind(a, 1614, 23)),
        Promise.resolve().then(a.t.bind(a, 8227, 23)),
        Promise.resolve().then(a.bind(a, 3940)),
        Promise.resolve().then(a.bind(a, 8694)));
    },
    8694: (e, t, a) => {
      'use strict';
      a.d(t, { ThemeProvider: () => o, useTheme: () => l });
      var r = a(6458),
        s = a(5122);
      let i = (0, s.createContext)(null),
        n = 'kuteka-theme';
      function o(e) {
        let { children: t } = e,
          [a, o] = (0, s.useState)('light'),
          [l, d] = (0, s.useState)(!1);
        ((0, s.useEffect)(() => {
          (o(
            (function () {
              let e = window.localStorage.getItem(n);
              return 'light' === e || 'dark' === e
                ? e
                : window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? 'dark'
                  : 'light';
            })(),
          ),
            d(!0));
        }, []),
          (0, s.useEffect)(() => {
            l &&
              (document.documentElement.classList.toggle('dark', 'dark' === a),
              window.localStorage.setItem(n, a));
          }, [a, l]));
        let c = (0, s.useCallback)((e) => {
            o(e);
          }, []),
          u = (0, s.useCallback)(() => {
            o((e) => ('light' === e ? 'dark' : 'light'));
          }, []),
          b = (0, s.useMemo)(() => ({ theme: a, setTheme: c, toggleTheme: u }), [a, c, u]);
        return (0, r.jsx)(i.Provider, { value: b, children: t });
      }
      function l() {
        let e = (0, s.useContext)(i);
        if (!e) throw Error('useTheme must be used within ThemeProvider');
        return e;
      }
    },
    8903: (e, t, a) => {
      'use strict';
      a.d(t, {
        Fc: () => P,
        eu: () => g,
        Ex: () => f,
        $n: () => l,
        Zp: () => h,
        Wu: () => w,
        aR: () => v,
        ZB: () => k,
        Sc: () => b,
        DZ: () => T,
        pd: () => d,
        JU: () => u,
        sx: () => m,
        EA: () => j,
        y$: () => N,
        EY: () => R,
        TM: () => c,
        NP: () => S.ThemeProvider,
        lc: () => z,
        m_: () => E.Tooltip,
        ru: () => o,
        DP: () => S.useTheme,
      });
      var r = a(6458),
        s = a(5370),
        i = a(5122),
        n = a(3417);
      let o = (0, s.F)(
          'inline-flex items-center justify-center gap-2 rounded-kuteka text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            variants: {
              variant: {
                primary: 'bg-brand-600 text-white hover:bg-brand-700',
                secondary:
                  'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700',
                outline:
                  'border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-50 dark:hover:bg-slate-900',
                ghost:
                  'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                danger: 'bg-danger text-white hover:bg-red-700',
              },
              size: { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6 text-base' },
            },
            defaultVariants: { variant: 'primary', size: 'md' },
          },
        ),
        l = (0, i.forwardRef)((e, t) => {
          let { className: a, variant: s, size: i, loading: l, disabled: d, children: c, ...u } = e;
          return (0, r.jsxs)('button', {
            ref: t,
            className: (0, n.cn)(o({ variant: s, size: i }), a),
            disabled: d || l,
            'aria-busy': l || void 0,
            ...u,
            children: [
              l
                ? (0, r.jsx)('span', {
                    className:
                      'size-4 animate-spin rounded-full border-2 border-current border-r-transparent',
                    'aria-hidden': !0,
                  })
                : null,
              c,
            ],
          });
        });
      l.displayName = 'Button';
      let d = (0, i.forwardRef)((e, t) => {
        let { className: a, invalid: s, ...i } = e;
        return (0, r.jsx)('input', {
          ref: t,
          className: (0, n.cn)(
            'flex h-10 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50',
            s && 'border-danger focus-visible:ring-danger',
            a,
          ),
          'aria-invalid': s || void 0,
          ...i,
        });
      });
      d.displayName = 'Input';
      let c = (0, i.forwardRef)((e, t) => {
        let { className: a, invalid: s, ...i } = e;
        return (0, r.jsx)('textarea', {
          ref: t,
          className: (0, n.cn)(
            'flex min-h-24 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50',
            s && 'border-danger focus-visible:ring-danger',
            a,
          ),
          'aria-invalid': s || void 0,
          ...i,
        });
      });
      c.displayName = 'Textarea';
      let u = (0, i.forwardRef)((e, t) => {
        let { className: a, ...s } = e;
        return (0, r.jsx)('label', {
          ref: t,
          className: (0, n.cn)('text-sm font-medium text-slate-700 dark:text-slate-200', a),
          ...s,
        });
      });
      u.displayName = 'Label';
      let b = (0, i.forwardRef)((e, t) => {
        let { className: a, ...s } = e;
        return (0, r.jsx)('input', {
          ref: t,
          type: 'checkbox',
          className: (0, n.cn)(
            'size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50',
            a,
          ),
          ...s,
        });
      });
      b.displayName = 'Checkbox';
      let m = (0, i.forwardRef)((e, t) => {
        let { className: a, ...s } = e;
        return (0, r.jsx)('input', {
          ref: t,
          type: 'radio',
          className: (0, n.cn)(
            'size-4 border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50',
            a,
          ),
          ...s,
        });
      });
      m.displayName = 'Radio';
      let x = (0, s.F)('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
        variants: {
          variant: {
            default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
            brand: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-amber-100 text-amber-800',
            danger: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800',
          },
        },
        defaultVariants: { variant: 'default' },
      });
      function f(e) {
        let { className: t, variant: a, ...s } = e;
        return (0, r.jsx)('span', { className: (0, n.cn)(x({ variant: a }), t), ...s });
      }
      let p = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' };
      function g(e) {
        let { src: t, alt: a = '', fallback: s = '?', size: i = 'md', className: o, ...l } = e;
        return (0, r.jsx)('div', {
          className: (0, n.cn)(
            'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100',
            p[i],
            o,
          ),
          ...l,
          children: t
            ? (0, r.jsx)('img', { src: t, alt: a, className: 'size-full object-cover' })
            : (0, r.jsx)('span', { 'aria-hidden': !0, children: s.slice(0, 2).toUpperCase() }),
        });
      }
      function h(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('div', {
          className: (0, n.cn)(
            'rounded-kuteka border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50',
            t,
          ),
          ...a,
        });
      }
      function v(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('div', { className: (0, n.cn)('flex flex-col gap-1.5 p-6', t), ...a });
      }
      function k(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('h3', {
          className: (0, n.cn)('text-lg font-semibold leading-none', t),
          ...a,
        });
      }
      function w(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('div', { className: (0, n.cn)('p-6 pt-0', t), ...a });
      }
      let y = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-8 border-[3px]' };
      function N(e) {
        let { size: t = 'md', className: a, ...s } = e;
        return (0, r.jsx)('div', {
          role: 'status',
          'aria-label': 'Loading',
          className: (0, n.cn)(
            'animate-spin rounded-full border-brand-600 border-r-transparent',
            y[t],
            a,
          ),
          ...s,
        });
      }
      function j(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('div', {
          className: (0, n.cn)('animate-pulse rounded-kuteka bg-slate-200 dark:bg-slate-800', t),
          ...a,
        });
      }
      let C = (0, s.F)('rounded-kuteka border px-4 py-3 text-sm', {
        variants: {
          variant: {
            default:
              'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            success: 'border-green-200 bg-green-50 text-green-900',
            warning: 'border-amber-200 bg-amber-50 text-amber-900',
            danger: 'border-red-200 bg-red-50 text-red-900',
            info: 'border-blue-200 bg-blue-50 text-blue-900',
          },
        },
        defaultVariants: { variant: 'default' },
      });
      function P(e) {
        let { className: t, variant: a, ...s } = e;
        return (0, r.jsx)('div', {
          role: 'alert',
          className: (0, n.cn)(C({ variant: a }), t),
          ...s,
        });
      }
      function z(e) {
        let { children: t } = e;
        return (0, r.jsx)(r.Fragment, { children: t });
      }
      var E = a(3940);
      function T(e) {
        let { level: t = 1, className: a, ...s } = e;
        return (0, r.jsx)('h'.concat(t), {
          className: (0, n.cn)(
            {
              1: 'text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50',
              2: 'text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50',
              3: 'text-2xl font-semibold text-slate-900 dark:text-slate-50',
              4: 'text-xl font-semibold text-slate-900 dark:text-slate-50',
            }[t],
            a,
          ),
          ...s,
        });
      }
      function R(e) {
        let { className: t, ...a } = e;
        return (0, r.jsx)('p', {
          className: (0, n.cn)('text-base leading-relaxed text-slate-600 dark:text-slate-300', t),
          ...a,
        });
      }
      var S = a(8694);
    },
    9482: (e, t, a) => {
      'use strict';
      a.d(t, { LandingTopbar: () => u });
      var r = a(6458),
        s = a(8903),
        i = a(3417),
        n = a(3778),
        o = a(1614),
        l = a.n(o),
        d = a(5122);
      let c = {
        seo: {
          title: 'Kuteka — Patrim\xf3nio. Confian\xe7a. Habita\xe7\xe3o.',
          description:
            'PropTech africana de patrim\xf3nio e confian\xe7a. Proteja, valorize e acompanhe o seu patrim\xf3nio imobili\xe1rio em Angola — com transpar\xeancia e profissionalismo.',
        },
        topbar: { brand: 'Kuteka', enter: 'Entrar', start: 'Come\xe7ar' },
        hero: {
          eyebrow: 'Kuteka \xb7 Angola',
          title: 'Patrim\xf3nio. Confian\xe7a. Habita\xe7\xe3o.',
          subtitle:
            'A plataforma que protege, valoriza e acompanha o seu patrim\xf3nio imobili\xe1rio — com transpar\xeancia e profissionalismo.',
          primaryCta: 'Come\xe7ar',
          secondaryCta: 'Explorar',
          imageAlt:
            'Ambiente residencial contempor\xe2neo — atmosfera de patrim\xf3nio e habita\xe7\xe3o digna',
        },
        difference: {
          id: 'diferenca',
          title: 'Porque a Kuteka \xe9 diferente',
          intro:
            'N\xe3o somos um site de an\xfancios. Somos uma plataforma de patrim\xf3nio e confian\xe7a.',
          pillars: [
            {
              id: 'trust',
              title: 'Confian\xe7a verific\xe1vel',
              text: 'Identidades, documentos e processos claros — para decidir com seguran\xe7a.',
            },
            {
              id: 'patrimony',
              title: 'Patrim\xf3nio, n\xe3o s\xf3 im\xf3veis',
              text: 'Cada activo pode ser activado, acompanhado e valorizado ao longo do tempo.',
            },
            {
              id: 'transparency',
              title: 'Transpar\xeancia total',
              text: 'Hist\xf3rico, estados e responsabilidades vis\xedveis para todas as partes.',
            },
          ],
        },
        howItWorks: {
          id: 'como-funciona',
          title: 'Como funciona',
          steps: [
            {
              n: '1',
              title: 'Descobrir',
              text: 'Encontre oportunidades com informa\xe7\xe3o clara.',
            },
            {
              n: '2',
              title: 'Confiar',
              text: 'Verifique score, documentos e hist\xf3rico do patrim\xf3nio.',
            },
            {
              n: '3',
              title: 'Activar',
              text: 'Clientes avan\xe7am; Parceiros Patrimoniais activam o seu patrim\xf3nio.',
            },
          ],
          cta: 'Come\xe7ar',
        },
        closing: {
          phrase:
            'Constru\xedda para durar — com confian\xe7a, tecnologia e excel\xeancia operacional.',
          cta: 'Come\xe7ar',
        },
        footer: {
          brand: 'Kuteka',
          links: [
            { href: '/termos', label: 'Termos de utiliza\xe7\xe3o' },
            { href: '/privacidade', label: 'Pol\xedtica de privacidade' },
            { href: '/contacto', label: 'Contacto' },
          ],
          copyright: '\xa9 '.concat(new Date().getFullYear(), ' Kuteka \xb7 Angola'),
        },
        routes: { start: '/auth', enter: '/auth?mode=entrar', exploreHash: '#diferenca' },
      };
      function u() {
        let [e, t] = (0, d.useState)(!1),
          [a, o] = (0, d.useState)(!1);
        return (
          (0, d.useEffect)(() => {
            let e = () => {
              let e = window.scrollY;
              (t(e > 8), o(e > 0.72 * window.innerHeight));
            };
            return (
              e(),
              window.addEventListener('scroll', e, { passive: !0 }),
              () => window.removeEventListener('scroll', e)
            );
          }, []),
          (0, r.jsx)('header', {
            className: (0, i.cn)(
              'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,color] duration-150',
              e
                ? a
                  ? 'border-b border-slate-200/80 bg-white/80 text-slate-900 backdrop-blur-md'
                  : 'border-b border-white/10 bg-slate-950/70 text-white backdrop-blur-md'
                : 'border-b border-transparent bg-transparent text-white',
            ),
            children: (0, r.jsxs)('div', {
              className:
                'mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6',
              children: [
                (0, r.jsxs)(l(), {
                  href: '/',
                  className: (0, i.cn)(
                    'flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                    a ? 'focus-visible:ring-offset-white' : 'focus-visible:ring-offset-slate-950',
                  ),
                  children: [
                    (0, r.jsx)(n.default, {
                      src: '/kuteka-logo.svg',
                      alt: '',
                      width: 28,
                      height: 28,
                      className: 'size-7',
                      unoptimized: !0,
                      priority: !0,
                    }),
                    (0, r.jsx)('span', {
                      className: 'text-base font-semibold tracking-tight',
                      children: c.topbar.brand,
                    }),
                  ],
                }),
                (0, r.jsxs)('nav', {
                  'aria-label': 'Principal',
                  className: 'flex items-center gap-2 sm:gap-3',
                  children: [
                    (0, r.jsx)(l(), {
                      href: c.routes.enter,
                      className: (0, i.cn)(
                        'hidden min-h-11 items-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:inline-flex',
                        a
                          ? 'text-slate-600 hover:text-slate-900'
                          : 'text-slate-200 hover:text-white',
                      ),
                      children: c.topbar.enter,
                    }),
                    (0, r.jsx)(l(), {
                      href: c.routes.start,
                      className: (0, i.cn)(
                        (0, s.ru)({ variant: 'primary', size: 'sm' }),
                        'min-h-11 px-4 text-sm',
                      ),
                      children: c.topbar.start,
                    }),
                  ],
                }),
              ],
            }),
          })
        );
      }
    },
  },
  (e) => {
    (e.O(0, [573, 614, 383, 387, 120, 358], () => e((e.s = 6027))), (_N_E = e.O()));
  },
]);
