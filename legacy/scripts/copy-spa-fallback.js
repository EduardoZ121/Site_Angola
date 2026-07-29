import { readFileSync, writeFileSync } from 'node:fs'

const SPA_BOOT = `<script>(function(){var p=sessionStorage.getItem('kutekaSpaPath');if(p){sessionStorage.removeItem('kutekaSpaPath');history.replaceState(null,'',p)}})();</script>`

const SPA_404 = `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <title>Kuteka</title>
    <script>
      sessionStorage.setItem('kutekaSpaPath', location.pathname + location.search + location.hash);
      location.replace('/');
    </script>
  </head>
  <body></body>
</html>
`

const indexPath = 'dist/index.html'
let indexHtml = readFileSync(indexPath, 'utf8')

if (!indexHtml.includes('kutekaSpaPath')) {
  indexHtml = indexHtml.replace('</body>', `${SPA_BOOT}</body>`)
}

writeFileSync(indexPath, indexHtml)
writeFileSync('dist/404.html', SPA_404)
writeFileSync('dist/_redirects', '/* /index.html 200\n')
