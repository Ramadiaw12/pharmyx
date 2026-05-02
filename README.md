# Pharmyx Sénégal

Plateforme web répertoriant **toutes les pharmacies de garde du Sénégal** avec carte interactive, recherche et administration.

## Lancer le projet

Aucune installation requise. C'est un site statique (HTML + CSS + JS pur).

### Option 1 — Ouvrir directement dans le navigateur

Double-cliquez sur `index.html`.

> **Note :** Certains navigateurs bloquent les requêtes locales (CORS). Si la carte ne s'affiche pas correctement, utilisez l'option 2.

### Option 2 — Serveur local (recommandé)

Avec **Python** (installé par défaut sur macOS/Linux) :

```bash
# Python 3
python -m http.server 8080

# Puis ouvrir : http://localhost:8080
```

Avec **Node.js** :

```bash
npx serve .
# Puis ouvrir l'URL affichée dans le terminal
```

Avec **VS Code** : installez l'extension *Live Server*, clic droit sur `index.html` → *Open with Live Server*.

---

## Structure du projet

```
pharma/
├── index.html          — Page principale (carte + liste)
├── admin.html          — Panneau d'administration
├── css/
│   └── style.css       — Styles (palette vert/blanc)
├── js/
│   ├── data.js         — Base de données des 55 pharmacies
│   └── app.js          — Logique de l'application
└── README.md
```

---

## Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| **Carte interactive** | Leaflet + OpenStreetMap, marqueurs verts cliquables |
| **Recherche** | Temps réel — nom, ville, quartier, adresse |
| **Filtres** | Par région : Dakar, Thiès, Saint-Louis, Ziguinchor, Kaolack, Tambacounda |
| **Fiche détail** | Adresse, téléphone, horaires, lien Google Maps (itinéraire) |
| **Responsive** | Mobile, tablette, desktop |
| **Administration** | CRUD complet avec persistance localStorage |

---

## Administration

URL : `admin.html`

Mot de passe par défaut : **`pharma2025`**

> En production, protégez cette page avec un vrai système d'authentification côté serveur.

Les modifications (ajout, édition, suppression) sont persistées dans le **localStorage** du navigateur et se reflètent immédiatement sur le site principal dans le même navigateur.

Pour remettre les données initiales : bouton **Réinitialiser** dans l'interface admin.

---

## Données

**55 pharmacies** réparties sur 10 régions :

| Région | Villes couvertes |
|---|---|
| Dakar | Dakar, Pikine, Guédiawaye, Rufisque |
| Thiès | Thiès, Mbour, Mékhé |
| Saint-Louis | Saint-Louis, Richard-Toll, Podor |
| Ziguinchor | Ziguinchor, Bignona |
| Kaolack | Kaolack, Nioro du Rip |
| Tambacounda | Tambacounda, Kolda, Vélingara, Kédougou, Bakel |

Pour ajouter vos propres pharmacies, utilisez le panneau admin ou éditez directement `js/data.js`.

---

## Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla ES6)
- **Carte** : [Leaflet.js](https://leafletjs.com/) + tuiles OpenStreetMap
- **Icônes** : Font Awesome 6
- **Police** : Inter (Google Fonts)
- **Stockage** : localStorage (côté navigateur)

---

## Charte graphique

| Élément | Valeur |
|---|---|
| Vert principal | `#2E7D32` |
| Vert clair | `#4CAF50` |
| Vert foncé | `#1B5E20` |
| Vert pâle (fonds) | `#E8F5E9` |
| Blanc | `#FFFFFF` |
| Police | Inter, sans-serif |

---

## Déploiement en production

Ce projet étant 100% statique, il peut être hébergé sur :

- **Netlify** : glisser-déposer le dossier sur [app.netlify.com](https://app.netlify.com)
- **Vercel** : `vercel --prod`
- **GitHub Pages** : pousser le dossier sur un dépôt GitHub
- **Tout hébergement web** classique (OVH, Hostinger, etc.)

Pour passer à une vraie base de données (données en temps réel, multi-utilisateurs), connectez `js/data.js` à une API REST ou Firebase Firestore.

---

*Pharmyx Sénégal — Votre santé, notre priorité.*
