# 💊 Pharmyx Sénégal

> Plateforme web de référencement des **pharmacies de garde du Sénégal** — carte interactive, recherche en temps réel et interface d’administration complète.

[![Status](https://img.shields.io/badge/statut-production-brightgreen)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900)]() [![VanillaJS](https://img.shields.io/badge/Vanilla_JS-ES6-f7df1e)]()

---

## 🚀 Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 🗺️ **Carte interactive** | Marqueurs cliquables (Leaflet + OpenStreetMap) avec zoom et déplacement fluides |
| 🔍 **Recherche temps réel** | Par nom, ville, quartier, adresse – résultats instantanés |
| 🎛️ **Filtrage par région** | Dakar, Thiès, Saint-Louis, Ziguinchor, Kaolack, Tambacounda |
| 📋 **Fiche détaillée** | Adresse, téléphone, horaires, lien d’itinéraire Google Maps |
| 📱 **Responsive** | Expérience optimale sur mobile, tablette et desktop |
| 🛠️ **Panneau d’administration** | CRUD complet (ajout, modification, suppression) avec persistance `localStorage` |
| 🔒 **Authentification simple** | Mot de passe protégé pour l’accès admin (à renforcer en production) |

---

## 📦 Structure du projet

```bash
pharmyx-senegal/
├── index.html          # Page principale (carte + liste)
├── admin.html          # Panneau d’administration
├── css/
│   └── style.css       # Styles (charte graphique vert/blanc)
├── js/
│   ├── data.js         # Données initiales (55 pharmacies)
│   └── app.js          # Logique métier (carte, recherche, filtres, admin)
└── README.md