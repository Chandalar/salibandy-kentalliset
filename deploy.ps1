# Salibandy Kentalliset - Automaattinen Julkaisuskripti (GitHub Pages & kokoonpano.web.app)

Write-Host "Aloitetaan paivitysten julkaisu osoitteeseen https://kokoonpano.web.app ..." -ForegroundColor Cyan

# 1. Tallenna ja tyonna GitHubiin (main & gh-pages)
git add .
git commit -m "Automaattinen Nimenhuuto-otteluiden taustahaku ja Live-osallistujien synkronointi tilojen välillä (v61.0)"
git push origin main
git checkout gh-pages
git merge main
git push -f origin gh-pages
git checkout main

Write-Host "GitHub Pages paivitetty!" -ForegroundColor Green

# 2. Julkaise Firebaseen (kokoonpano.web.app & Firestore rules)
Write-Host "Julkaistaan osoitteeseen https://kokoonpano.web.app ..." -ForegroundColor Yellow
npx --yes firebase-tools deploy --only hosting,firestore:rules

Write-Host "Valmis! Sovellus julkaistu osoitteessa https://kokoonpano.web.app !" -ForegroundColor Green
