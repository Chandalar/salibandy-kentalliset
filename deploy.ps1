# Salibandy Kentälliset - Automaattinen Julkaisuskripti (GitHub Pages & kokoonpano.web.app)

Write-Host "🚀 Aloitetaan päivitysten julkaisu osoitteeseen https://kokoonpano.web.app ..." -ForegroundColor Cyan

# 1. Tallenna ja työnnä GitHubiin (main & gh-pages)
git add .
git commit -m "Automaattinen päivitys (GitHub & kokoonpano.web.app)"
git push origin main
git checkout gh-pages
git merge main
git push -f origin gh-pages
git checkout main

Write-Host "✅ GitHub Pages päivitetty!" -ForegroundColor Green

# 2. Julkaise Firebase Hostingiin (kokoonpano.web.app)
Write-Host "🔥 Julkaistaan osoitteeseen https://kokoonpano.web.app ..." -ForegroundColor Yellow
npx --yes firebase-tools deploy --only hosting

Write-Host "🎉 Valmis! Sovellus julkaistu osoitteessa https://kokoonpano.web.app !" -ForegroundColor Green
