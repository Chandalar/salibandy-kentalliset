# Salibandy Kentälliset - Automaattinen Julkaisuskripti (GitHub Pages & Firebase Hosting)

Write-Host "🚀 Aloitetaan päivitysten julkaisu sekä GitHubiin että Firebase Hostingiin..." -ForegroundColor Cyan

# 1. Tallenna ja työnnä GitHubiin (main & gh-pages)
git add .
git commit -m "Automaattinen päivitys (GitHub & Firebase)"
git push origin main
git checkout gh-pages
git merge main
git push -f origin gh-pages
git checkout main

Write-Host "✅ GitHub Pages päivitetty!" -ForegroundColor Green

# 2. Julkaise Firebase Hostingiin (line-up-a773b.web.app)
Write-Host "🔥 Julkaistaan osoitteeseen https://line-up-a773b.web.app ..." -ForegroundColor Yellow
npx --yes firebase-tools deploy --only hosting

Write-Host "🎉 Valmis! Sovellus päivitetty molempiin osoitteisiin!" -ForegroundColor Green
