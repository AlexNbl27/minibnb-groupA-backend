# 📋 Audit Technique Backend MiniBnB

**Date de l'audit** : 15 janvier 2026
**Version** : 1.0.0
**Auditeur** : Claude (Analyse automatisée)

---

## 📊 Résumé Exécutif

| Critère | Note | Statut |
|---------|------|--------|
| API REST | 9/10 | ✅ Excellent |
| Versionning API | 10/10 | ✅ Excellent |
| Sécurité | 9/10 | ✅ Excellent |
| Cache | 6/10 | ⚠️ Partiel |
| Qualité | 8/10 | ✅ Très bien |
| **TOTAL** | **84%** | **✅ Conforme** |

---

## 🎯 Conformité aux Exigences

### 1. API REST - Bonnes Pratiques ✅ 9/10

#### ✅ Points conformes

**Ressources bien définies**
- ✅ Structure claire et logique :
  - `/api/v1/auth` - Authentification
  - `/api/v1/profiles` - Profils utilisateurs
  - `/api/v1/listings` - Annonces
  - `/api/v1/bookings` - Réservations
  - `/api/v1/conversations` - Messages
  - `/api/v1/cohosts` - Co-hôtes

**Méthodes HTTP cohérentes**
- ✅ `GET` - Lecture (listings, bookings, profiles)
- ✅ `POST` - Création (signup, login, create listing/booking)
- ✅ `PATCH` - Mise à jour partielle (update listing)
- ✅ `DELETE` - Suppression (delete listing)

**Codes de statut appropriés**
```typescript
✅ 200 OK - Lecture réussie
✅ 201 Created - Ressource créée (signup, create listing)
✅ 400 Bad Request - Erreur de validation (Zod)
✅ 401 Unauthorized - Token manquant/invalide
✅ 403 Forbidden - Permissions insuffisantes
✅ 404 Not Found - Ressource inexistante
✅ 409 Conflict - Utilisateur déjà existant
✅ 500 Internal Server Error - Erreurs serveur
```

**Format de réponse uniforme**
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### ⚠️ Points d'amélioration mineurs

- Pas de rate limiting visible (protection anti-spam)
- Pas de logging structuré (Winston, Pino, etc.)

**Localisation** :
- `src/routes/v1/` - Routes RESTful
- `src/utils/response.ts` - Format de réponse
- `src/utils/errors.ts` - Codes de statut

---

### 2. Versionning de l'API ✅ 10/10

#### ✅ Architecture prête pour plusieurs versions

**Structure modulaire**
```
src/routes/
├── index.ts              # Point d'entrée principal
└── v1/                   # Version 1 de l'API
    ├── index.ts          # Routes v1
    ├── auth.routes.ts
    ├── listing.routes.ts
    ├── booking.routes.ts
    ├── profile.routes.ts
    ├── message.routes.ts
    └── cohost.routes.ts
```

**URL versionnées**
- ✅ `/api/v1/auth/*`
- ✅ `/api/v1/listings/*`
- ✅ `/api/v1/bookings/*`

**Facilité d'ajout de v2**
```typescript
// src/routes/index.ts
router.use("/v1", v1Routes);
router.use("/v2", v2Routes); // Prêt pour v2
```

**Localisation** :
- `src/routes/index.ts:6` - Router principal
- `src/routes/v1/index.ts` - Routes v1

---

### 3. Sécurité ✅ 9/10

#### ✅ Authentification JWT

**Access Token + Refresh Token implémentés**
```typescript
// Durée de vie
Access Token:  1 heure  (httpOnly, secure)
Refresh Token: 7 jours  (httpOnly, secure)
```

**Sources** :
- `src/config/cookies.ts:11-19` - Configuration cookies
- `src/routes/v1/auth.routes.ts:200-230` - Route /refresh
- `src/services/auth.service.ts:37-44` - Service refreshSession

**Middleware d'authentification**
```typescript
✅ Supporte Cookie ET Header Authorization
✅ Vérifie le token avec Supabase
✅ Injecte req.user pour les routes protégées
```

**Localisation** : `src/middlewares/auth.middleware.ts`

#### ✅ Gestion des droits côté serveur

**Contrôles d'accès implémentés**
- ✅ Seuls les hôtes peuvent créer des annonces (`src/services/listing.service.ts:8-17`)
- ✅ Seul l'hôte peut supprimer son annonce (`src/services/listing.service.ts:111-125`)
- ✅ Hôte + Co-hôtes autorisés peuvent éditer (`src/services/listing.service.ts:128-150`)
- ✅ Permissions granulaires pour co-hôtes :
  - `can_edit_listing`
  - `can_access_messages`
  - `can_respond_messages`

**Localisation** : `src/services/listing.service.ts`

#### ✅ Sécurité HTTP

**Helmet configuré**
```typescript
✅ Content Security Policy
✅ XSS Protection
✅ Frameguard
✅ HSTS (HTTPS strict)
```

**CORS sécurisé**
```typescript
✅ Origine contrôlée (whitelist)
✅ Credentials autorisés
✅ Pas de wildcard "*"
```

**Localisation** :
- `src/app.ts:16-25` - Helmet
- `src/app.ts:35-45` - CORS

#### ⚠️ Améliorations possibles

- Rate limiting (express-rate-limit)
- Validation des entrées encore plus stricte (sanitization XSS)
- Logs de sécurité structurés

---

### 4. Cache ⚠️ 6/10

#### ✅ Cache serveur (Redis)

**Middleware de cache implémenté**
```typescript
✅ GET /listings        → Cache 5 min (300s)
✅ GET /listings/:id    → Cache 1h (3600s)
✅ Invalidation après POST/PATCH/DELETE
```

**Service de cache**
```typescript
✅ invalidatePattern() - Invalide par pattern
✅ invalidateListingCache() - Invalide annonce
✅ invalidateBookingCache() - Invalide réservation
```

**Localisation** :
- `src/middlewares/cache.middleware.ts` - Middleware
- `src/services/cache.service.ts` - Service d'invalidation
- `src/config/redis.ts` - Configuration Redis

#### ❌ Cache navigateur (MANQUANT)

**Headers de cache HTTP absents**
```http
❌ Cache-Control: max-age=3600, public
❌ ETag: "abc123"
❌ Last-Modified: Wed, 15 Jan 2026 10:00:00 GMT
```

**Impact** :
- Le navigateur recharge toujours les données
- Latence inutile pour l'utilisateur
- Charge serveur augmentée

**Recommandation** :
Ajouter un middleware pour injecter les headers de cache :

```typescript
// Exemple de solution
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 min
  }
  next();
});
```

**Localisation des modifications nécessaires** :
- Créer `src/middlewares/http-cache.middleware.ts`
- Ajouter dans `src/routes/v1/listing.routes.ts`

---

### 5. Qualité ✅ 8/10

#### ✅ Validation des données

**Zod - Validation stricte**
```typescript
✅ Toutes les routes POST/PATCH validées
✅ Schémas réutilisables (DRY)
✅ Messages d'erreur clairs
✅ Validation des types (email, URL, dates)
```

**Exemples** :
- `src/validators/listing.validator.ts` - Annonces
- `src/validators/booking.validator.ts` - Réservations
- `src/validators/user.validator.ts` - Utilisateurs
- `src/validators/message.validator.ts` - Messages

**Middleware** : `src/middlewares/validation.middleware.ts`

#### ✅ Gestion des erreurs

**Middleware centralisé**
```typescript
✅ Capture toutes les erreurs
✅ Erreurs personnalisées avec codes HTTP
✅ Format JSON uniforme
✅ Gestion spéciale des erreurs Zod
```

**Classes d'erreurs**
```typescript
✅ AppError (base)
✅ BadRequestError (400)
✅ UnauthorizedError (401)
✅ ForbiddenError (403)
✅ NotFoundError (404)
✅ ConflictError (409)
```

**Localisation** :
- `src/middlewares/error.middleware.ts` - Middleware
- `src/utils/errors.ts` - Classes d'erreurs

#### ✅ Tests automatisés

**Jest + Supertest configurés**
```typescript
✅ Tests unitaires (services)
✅ Tests d'intégration (routes)
✅ Mocking Supabase
✅ Configuration ts-jest
```

**Tests présents** :
- `tests/routes/v1/auth.routes.test.ts`
- `tests/routes/v1/listing.routes.test.ts`
- `tests/routes/v1/booking.routes.test.ts`
- `tests/routes/v1/message.routes.test.ts`
- `tests/services/auth.service.test.ts`

**Scripts disponibles** :
```bash
pnpm test          # Lancer les tests
pnpm test:watch    # Mode watch
pnpm test:coverage # Couverture
```

#### ✅ Documentation API

**Swagger/OpenAPI 3.0**
```typescript
✅ Documentation complète des endpoints
✅ Schémas de requête/réponse
✅ Exemples d'utilisation
✅ Authentification documentée (bearerAuth)
✅ Accessible sur /docs, /v1/docs, /api/v1/docs
```

**Localisation** : `src/config/swagger.ts`

#### ❌ Schéma d'architecture (MANQUANT)

**Documentation manquante** :
- ❌ Pas de README.md
- ❌ Pas de diagramme d'architecture
- ❌ Pas de schéma de la base de données

**Présent** :
- ✅ Documentation de déploiement (`DEPLOYMENT.md`)

**Recommandation** :
Créer un `ARCHITECTURE.md` avec :
- Diagramme de l'architecture (frontend, backend, Supabase, Redis)
- Schéma de la base de données (tables, relations)
- Flow d'authentification (JWT)
- Flow de cache

---

## 📈 Recommandations Prioritaires

### 🔴 Haute Priorité

1. **Implémenter les headers de cache HTTP**
   - Ajouter `Cache-Control` sur les routes GET
   - Implémenter les ETags pour la validation conditionnelle
   - Réduire la latence côté client

   **Fichiers à créer** :
   - `src/middlewares/http-cache.middleware.ts`

   **Fichiers à modifier** :
   - `src/routes/v1/listing.routes.ts:61` - GET /listings
   - `src/routes/v1/listing.routes.ts:113` - GET /listings/:id

2. **Créer la documentation d'architecture**
   - Rédiger `ARCHITECTURE.md`
   - Ajouter un diagramme d'architecture
   - Documenter le schéma de base de données
   - Créer un `README.md` complet

### 🟡 Priorité Moyenne

3. **Améliorer la couverture de tests**
   - Exécuter `pnpm test:coverage`
   - Viser 80% de couverture minimum
   - Ajouter des tests pour les edge cases

4. **Ajouter du logging structuré**
   - Intégrer Winston ou Pino
   - Logger les erreurs, authentifications, accès
   - Centraliser les logs (Sentry, Datadog, etc.)

### 🟢 Basse Priorité

5. **Implémenter le rate limiting**
   - Protéger contre les attaques par force brute
   - Limiter les requêtes par IP/utilisateur
   - Utiliser `express-rate-limit`

6. **Ajouter des métriques de performance**
   - Temps de réponse par endpoint
   - Nombre de requêtes par ressource
   - Taux d'erreur

---

## 🔧 Guide de Résolution Détaillé

Cette section fournit toutes les informations nécessaires pour résoudre les problèmes identifiés dans l'audit. Chaque solution inclut le contexte technique, le code complet, et les étapes de validation.

---

### 🔴 PRIORITÉ 1 : Implémenter le Cache Navigateur (HTTP Cache Headers)

#### 📋 Contexte Technique

**Problème actuel** :
- Le backend utilise Redis pour le cache serveur (✅ implémenté)
- Mais les headers HTTP de cache (`Cache-Control`, `ETag`, `Last-Modified`) sont absents
- Résultat : Le navigateur ne met rien en cache et redemande toujours au serveur

**Impact** :
- Latence utilisateur inutile
- Charge serveur augmentée
- Bande passante gaspillée

**Solution à implémenter** :
1. Créer un middleware qui ajoute les headers HTTP de cache
2. Appliquer ce middleware sur les routes GET de lecture
3. Implémenter la validation conditionnelle avec ETags

---

#### 📝 Étape 1 : Créer le Middleware HTTP Cache

**Fichier à créer** : `src/middlewares/http-cache.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface HttpCacheOptions {
    /**
     * Durée de cache en secondes
     * @example 300 (5 minutes), 3600 (1 heure)
     */
    maxAge: number;

    /**
     * Type de cache
     * - 'public' : Cache partagé (CDN, proxy) + navigateur
     * - 'private' : Cache navigateur uniquement
     */
    cacheType?: "public" | "private";

    /**
     * Activer les ETags pour la validation conditionnelle
     * Si activé, retourne 304 Not Modified si le contenu n'a pas changé
     */
    enableETag?: boolean;
}

/**
 * Middleware pour ajouter les headers de cache HTTP
 *
 * @example
 * // Cache public de 5 minutes avec ETags
 * router.get("/listings", httpCache({ maxAge: 300, cacheType: "public", enableETag: true }), handler)
 *
 * // Cache privé d'1 heure sans ETags
 * router.get("/me", httpCache({ maxAge: 3600, cacheType: "private" }), handler)
 */
export const httpCache = (options: HttpCacheOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { maxAge, cacheType = "public", enableETag = true } = options;

        // Construire le header Cache-Control
        const cacheControl = `${cacheType}, max-age=${maxAge}`;

        // Ajouter les headers de cache
        res.set("Cache-Control", cacheControl);

        // Si ETags activés, intercepter la réponse
        if (enableETag) {
            const originalJson = res.json.bind(res);

            res.json = function (body: any) {
                // Générer un ETag basé sur le contenu
                const content = JSON.stringify(body);
                const etag = `"${crypto.createHash("md5").update(content).digest("hex")}"`;

                // Ajouter le header ETag
                res.set("ETag", etag);

                // Vérifier si le client a déjà la même version (If-None-Match)
                const clientETag = req.headers["if-none-match"];

                if (clientETag === etag) {
                    // Le contenu n'a pas changé, retourner 304 Not Modified
                    return res.status(304).end();
                }

                // Le contenu a changé, retourner normalement
                return originalJson(body);
            };
        }

        next();
    };
};

/**
 * Middleware pour désactiver le cache (pour les routes sensibles)
 *
 * @example
 * router.post("/auth/login", noCache, handler)
 */
export const noCache = (req: Request, res: Response, next: NextFunction) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0",
    });
    next();
};
```

---

#### 📝 Étape 2 : Modifier les Routes pour Utiliser le Middleware

**Fichier à modifier** : `src/routes/v1/listing.routes.ts`

**AVANT (ligne 61)** :
```typescript
router.get("/", cacheMiddleware(300), async (req, res, next) => {
```

**APRÈS** :
```typescript
import { httpCache, noCache } from "../../middlewares/http-cache.middleware";

router.get("/", cacheMiddleware(300), httpCache({ maxAge: 300, cacheType: "public", enableETag: true }), async (req, res, next) => {
```

**Explication** :
- `cacheMiddleware(300)` : Cache serveur Redis (5 min)
- `httpCache({ maxAge: 300 })` : Cache navigateur (5 min)
- `enableETag: true` : Validation conditionnelle (304 Not Modified)

**AVANT (ligne 113)** :
```typescript
router.get("/:id", cacheMiddleware(3600), async (req, res, next) => {
```

**APRÈS** :
```typescript
router.get("/:id", cacheMiddleware(3600), httpCache({ maxAge: 3600, cacheType: "public", enableETag: true }), async (req, res, next) => {
```

---

#### 📝 Étape 3 : Appliquer sur les Autres Routes GET

**Fichiers à modifier** :
1. `src/routes/v1/booking.routes.ts:44` - GET /bookings/me (cache privé)
2. `src/routes/v1/profile.routes.ts` - GET /profiles/:id (cache public)
3. `src/routes/v1/message.routes.ts` - GET /conversations/* (cache privé)

**Exemple pour les bookings** :
```typescript
// Cache privé car données personnelles
router.get("/me", authenticate, httpCache({ maxAge: 60, cacheType: "private", enableETag: true }), async (req, res, next) => {
```

**Exemple pour routes sensibles** (auth) :
```typescript
// Pas de cache pour les routes d'authentification
router.post("/login", noCache, validate(loginSchema), async (req, res, next) => {
router.post("/refresh", noCache, async (req, res, next) => {
```

---

#### ✅ Validation de la Solution

**Test 1 : Vérifier les headers HTTP**
```bash
# Tester une route avec cache
curl -I http://localhost:5000/api/v1/listings

# Devrait retourner :
# Cache-Control: public, max-age=300
# ETag: "abc123def456..."
```

**Test 2 : Tester la validation conditionnelle (304)**
```bash
# 1. Récupérer l'ETag
ETAG=$(curl -s -I http://localhost:5000/api/v1/listings | grep -i etag | cut -d' ' -f2)

# 2. Renvoyer avec If-None-Match
curl -I -H "If-None-Match: $ETAG" http://localhost:5000/api/v1/listings

# Devrait retourner :
# HTTP/1.1 304 Not Modified
```

**Test 3 : Vérifier dans le navigateur**
1. Ouvrir DevTools → Network
2. Charger `/api/v1/listings`
3. Recharger la page (F5)
4. Devrait voir "304 Not Modified" ou "(disk cache)"

**Test 4 : Mesurer l'impact**
```bash
# Avant : Toujours 200 avec le body complet
# Après : 304 sans body (économie de bande passante)

# Mesurer le temps de réponse
time curl http://localhost:5000/api/v1/listings # ~100ms
time curl -H "If-None-Match: $ETAG" http://localhost:5000/api/v1/listings # ~10ms
```

---

### 🔴 PRIORITÉ 2 : Créer la Documentation d'Architecture

#### 📋 Contexte Technique

**Problème actuel** :
- Pas de README.md pour guider les nouveaux développeurs
- Pas de schéma d'architecture pour comprendre le système
- Pas de documentation de la base de données

**Solution à implémenter** :
1. Créer un `README.md` complet avec quickstart
2. Créer un `ARCHITECTURE.md` avec diagrammes
3. Documenter le schéma de base de données

---

#### 📝 Étape 1 : Créer le README.md

**Fichier à créer** : `README.md`

```markdown
# 🏠 MiniBnB Backend API

Backend REST API pour l'application MiniBnB (plateforme de location de logements type Airbnb).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Table des Matières

- [Caractéristiques](#-caractéristiques)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Tests](#-tests)
- [Documentation API](#-documentation-api)
- [Architecture](#-architecture)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)

---

## ✨ Caractéristiques

### API REST v1
- ✅ **RESTful** : Ressources bien définies, méthodes HTTP cohérentes
- ✅ **Versionnée** : Architecture prête pour v2, v3, etc.
- ✅ **Documentée** : Swagger/OpenAPI 3.0 complet

### Sécurité
- 🔐 **JWT Authentication** : Access tokens + refresh tokens
- 🛡️ **Contrôle d'accès** : Permissions granulaires (hôtes, co-hôtes, invités)
- 🔒 **Helmet** : Protection contre les vulnérabilités courantes
- 🌐 **CORS** : Configuration sécurisée avec whitelist

### Performance
- ⚡ **Cache serveur** : Redis pour les données fréquentes
- 📦 **Cache navigateur** : Headers HTTP (Cache-Control, ETags)
- 🎯 **Invalidation intelligente** : Cache invalidé automatiquement

### Qualité
- ✅ **Validation stricte** : Zod sur toutes les entrées
- 🧪 **Tests automatisés** : Jest + Supertest
- 🐛 **Gestion d'erreurs** : Messages clairs et codes HTTP appropriés
- 📝 **TypeScript** : Typage statique complet

---

## 🛠️ Technologies

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | ≥20.0.0 | Runtime JavaScript |
| **TypeScript** | 5.9.3 | Typage statique |
| **Express.js** | 5.2.1 | Framework web |
| **Supabase** | 2.90.1 | Base de données PostgreSQL + Auth JWT |
| **Redis** | 5.10.0 | Cache serveur |
| **Zod** | 4.3.5 | Validation de schémas |
| **Jest** | 30.2.0 | Tests unitaires et d'intégration |
| **Swagger** | 6.2.8 | Documentation API OpenAPI 3.0 |

---

## 📦 Prérequis

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 8.0.0
- **Redis** (local ou distant)
- **Compte Supabase** (gratuit)

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/AlexNbl27/minibnb-groupA-backend.git
cd minibnb-groupA-backend
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configuration (voir section suivante)

---

## ⚙️ Configuration

### 1. Créer le fichier `.env`

```bash
cp .env.example .env
```

### 2. Remplir les variables d'environnement

```env
# Environnement
NODE_ENV=development
PORT=5000

# Supabase (https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=    # Optionnel
```

### 3. Démarrer Redis (si local)

```bash
# macOS (Homebrew)
brew services start redis

# Linux (systemd)
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## 🎯 Démarrage

### Mode Développement (avec hot reload)

```bash
pnpm dev
```

Le serveur démarre sur `http://localhost:5000`

### Mode Production

```bash
# Build
pnpm build

# Start
pnpm start
```

---

## 🧪 Tests

```bash
# Lancer tous les tests
pnpm test

# Mode watch (développement)
pnpm test:watch

# Avec couverture
pnpm test:coverage
```

---

## 📚 Documentation API

La documentation Swagger est accessible sur :

- **Local** : http://localhost:5000/docs
- **Production** : https://minibnb-backend.vincentmagnien.com/docs

### Endpoints Principaux

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/api/v1/auth/signup` | POST | Créer un compte | ❌ |
| `/api/v1/auth/login` | POST | Se connecter | ❌ |
| `/api/v1/auth/refresh` | POST | Rafraîchir le token | ❌ |
| `/api/v1/listings` | GET | Lister les annonces | ❌ |
| `/api/v1/listings/:id` | GET | Détails d'une annonce | ❌ |
| `/api/v1/listings` | POST | Créer une annonce | ✅ |
| `/api/v1/bookings/me` | GET | Mes réservations | ✅ |
| `/api/v1/bookings` | POST | Créer une réservation | ✅ |

---

## 🏗️ Architecture

Voir le fichier [ARCHITECTURE.md](ARCHITECTURE.md) pour :
- Diagramme de l'architecture système
- Schéma de la base de données
- Flow d'authentification JWT
- Stratégie de cache

**Structure du code** :
```
src/
├── app.ts                    # Point d'entrée Express
├── config/                   # Configuration (Supabase, Redis, etc.)
├── middlewares/              # Middlewares (auth, cache, validation)
├── routes/v1/                # Routes API v1
├── services/                 # Logique métier
├── validators/               # Schémas de validation Zod
├── types/                    # Types TypeScript
└── utils/                    # Utilitaires (erreurs, réponses)
```

---

## 🚢 Déploiement

Voir le fichier [DEPLOYMENT.md](DEPLOYMENT.md) pour le guide complet.

### Déploiement Automatique (CI/CD)

Le projet utilise GitHub Actions pour déployer automatiquement sur Portainer :

1. **Push sur `main`** → Tests → Build Docker → Déploiement
2. Image Docker publiée sur GitHub Container Registry
3. Stack Portainer mis à jour automatiquement

### Variables d'Environnement en Production

Configurer dans **GitHub Secrets** :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `REDIS_HOST`
- etc.

---

## 🤝 Contribution

### Workflow Git

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Faire vos modifications
3. Tester : `pnpm test`
4. Commiter : `git commit -m "feat: ajouter ma fonctionnalité"`
5. Push : `git push origin feature/ma-fonctionnalite`
6. Créer une Pull Request

### Standards de Code

- **TypeScript** : Typage strict activé
- **ESLint** : (À configurer)
- **Tests** : Couverture > 80%
- **Commits** : Format [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 License

MIT License - voir le fichier [LICENSE](LICENSE)

---

## 👥 Équipe

- **Alex** - GitHub: [@AlexNbl27](https://github.com/AlexNbl27)
- **Vincent** - Déploiement

---

## 🐛 Bugs & Support

Créer une issue sur GitHub : [Issues](https://github.com/AlexNbl27/minibnb-groupA-backend/issues)

---

## 📞 Contact

Pour toute question : [Créer une issue](https://github.com/AlexNbl27/minibnb-groupA-backend/issues/new)
```

---

#### 📝 Étape 2 : Créer ARCHITECTURE.md

**Fichier à créer** : `ARCHITECTURE.md`

```markdown
# 🏗️ Architecture du Backend MiniBnB

Ce document décrit l'architecture technique du backend MiniBnB.

---

## 📐 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React/Next.js)                              │
│                  http://localhost:3000                          │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS (CORS enabled)
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                      BACKEND API                                │
│                    (Express + TypeScript)                       │
│                  http://localhost:5000                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Middlewares                           │  │
│  │  • Helmet (Security)                                     │  │
│  │  • CORS (Cross-Origin)                                   │  │
│  │  • Cookie Parser (JWT cookies)                           │  │
│  │  • Validation (Zod)                                      │  │
│  │  • Authentication (JWT verify)                           │  │
│  │  • Cache (HTTP headers + Redis)                          │  │
│  │  • Error Handler                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Routes (v1)                            │  │
│  │  • /api/v1/auth                                          │  │
│  │  • /api/v1/listings                                      │  │
│  │  • /api/v1/bookings                                      │  │
│  │  • /api/v1/profiles                                      │  │
│  │  • /api/v1/conversations                                 │  │
│  │  • /api/v1/cohosts                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Services                              │  │
│  │  • AuthService (signup, login, refresh)                  │  │
│  │  • ListingService (CRUD + permissions)                   │  │
│  │  • BookingService (create, validate dates)               │  │
│  │  • CacheService (invalidation)                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
           │                              │
┌──────────▼──────────────┐    ┌─────────▼──────────────┐
│      SUPABASE           │    │       REDIS            │
│   (PostgreSQL + Auth)   │    │    (Cache serveur)     │
│                         │    │                        │
│  • Tables (listings,    │    │  • TTL: 60s-3600s      │
│    bookings, profiles)  │    │  • Invalidation auto   │
│  • Auth JWT             │    │  • Pattern matching    │
│  • RLS (Row Level       │    │                        │
│    Security)            │    │                        │
└─────────────────────────┘    └────────────────────────┘
```

---

## 🗄️ Schéma de la Base de Données (Supabase/PostgreSQL)

### Table: `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    is_host BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relations** :
- `id` → `auth.users(id)` : Lié au système d'authentification Supabase

---

### Table: `listings`
```sql
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES profiles(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    picture_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    neighbourhood_group_cleansed VARCHAR(100),
    bedrooms INTEGER DEFAULT 1,
    beds INTEGER DEFAULT 1,
    bathrooms DECIMAL(3,1) DEFAULT 1.0,
    max_guests INTEGER DEFAULT 2,
    property_type VARCHAR(100) DEFAULT 'Rental unit',
    rules TEXT,
    amenities TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_host_id ON listings(host_id);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_is_active ON listings(is_active);
```

**Relations** :
- `host_id` → `profiles(id)` : L'hôte qui possède l'annonce

---

### Table: `bookings`
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    guest_id UUID NOT NULL REFERENCES profiles(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
```

**Relations** :
- `listing_id` → `listings(id)` : L'annonce réservée
- `guest_id` → `profiles(id)` : L'invité qui réserve

---

### Table: `co_hosts`
```sql
CREATE TABLE co_hosts (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    host_id UUID NOT NULL REFERENCES profiles(id),
    co_host_id UUID NOT NULL REFERENCES profiles(id),
    can_edit_listing BOOLEAN DEFAULT FALSE,
    can_access_messages BOOLEAN DEFAULT FALSE,
    can_respond_messages BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(listing_id, co_host_id)
);

CREATE INDEX idx_co_hosts_listing_id ON co_hosts(listing_id);
CREATE INDEX idx_co_hosts_co_host_id ON co_hosts(co_host_id);
```

**Relations** :
- `listing_id` → `listings(id)` : L'annonce gérée
- `host_id` → `profiles(id)` : L'hôte principal
- `co_host_id` → `profiles(id)` : Le co-hôte ajouté

---

### Table: `conversations`
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    guest_id UUID NOT NULL REFERENCES profiles(id),
    host_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(listing_id, guest_id)
);
```

---

### Table: `messages`
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

---

## 🔐 Flow d'Authentification JWT

```
┌─────────────┐                                    ┌─────────────┐
│   CLIENT    │                                    │   BACKEND   │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │  1. POST /api/v1/auth/signup                    │
       │     { email, password, first_name, last_name }  │
       ├─────────────────────────────────────────────────>│
       │                                                  │
       │                                    2. Supabase.auth.signUp()
       │                                          ┌───────┴───────┐
       │                                          │   SUPABASE    │
       │                                          │ JWT generated │
       │                                          └───────┬───────┘
       │                                                  │
       │  3. Set-Cookie: access_token (1h)               │
       │     Set-Cookie: refresh_token (7d)              │
       │<─────────────────────────────────────────────────┤
       │     { success: true, data: { user } }           │
       │                                                  │
       │                                                  │
       │  4. GET /api/v1/listings (protected)            │
       │     Cookie: access_token=xxx                    │
       ├─────────────────────────────────────────────────>│
       │                                                  │
       │                                    5. Middleware authenticate()
       │                                       - Extract token from cookie
       │                                       - Supabase.auth.getUser(token)
       │                                       - Inject req.user
       │                                                  │
       │  6. { success: true, data: [...] }              │
       │<─────────────────────────────────────────────────┤
       │                                                  │
       │                                                  │
       │  7. Access token expiré après 1h                │
       │     POST /api/v1/auth/refresh                   │
       │     Cookie: refresh_token=yyy                   │
       ├─────────────────────────────────────────────────>│
       │                                                  │
       │                                    8. Supabase.auth.refreshSession()
       │                                          ┌───────┴───────┐
       │                                          │   SUPABASE    │
       │                                          │ New JWT token │
       │                                          └───────┬───────┘
       │                                                  │
       │  9. Set-Cookie: access_token (new)              │
       │     Set-Cookie: refresh_token (new)             │
       │<─────────────────────────────────────────────────┤
       │     { success: true, data: { user } }           │
       │                                                  │
```

### Sécurité des Cookies JWT

```typescript
{
  httpOnly: true,        // Inaccessible au JavaScript (protection XSS)
  secure: true,          // HTTPS uniquement en production
  sameSite: 'lax',       // Protection CSRF
  maxAge: 3600000        // 1 heure (access token)
}
```

---

## ⚡ Stratégie de Cache

### Cache Multi-Niveaux

```
CLIENT REQUEST
      │
      ▼
┌─────────────────┐
│ 1. BROWSER      │  Cache-Control: public, max-age=300
│    CACHE        │  ETag: "abc123"
│    (5 min)      │  → 304 Not Modified (si ETag match)
└────────┬────────┘
         │ Cache MISS
         ▼
┌─────────────────┐
│ 2. REDIS        │  Key: cache:/api/v1/listings?city=Paris
│    CACHE        │  TTL: 300s (5 min)
│    (Server)     │  → Hit: Return cached JSON
└────────┬────────┘
         │ Cache MISS
         ▼
┌─────────────────┐
│ 3. SUPABASE     │  SELECT * FROM listings WHERE city = 'Paris'
│    DATABASE     │  → Query database
│    (PostgreSQL) │  → Cache result in Redis
└─────────────────┘  → Add HTTP cache headers
                     → Return to client
```

### Configuration du Cache par Ressource

| Ressource | Cache Navigateur | Cache Redis | Type | Raison |
|-----------|------------------|-------------|------|--------|
| `GET /listings` | 5 min (300s) | 5 min | Public | Liste peu modifiée |
| `GET /listings/:id` | 1h (3600s) | 1h | Public | Détails rarement modifiés |
| `GET /bookings/me` | 1 min (60s) | Non | Private | Données personnelles |
| `GET /profiles/:id` | 15 min (900s) | 15 min | Public | Profils stables |
| `POST /bookings` | Non | Non | - | Mutation |

### Invalidation du Cache

**Scénarios d'invalidation** :
1. **Création d'annonce** (`POST /listings`)
   - Invalide `cache:/api/v1/listings?*` (toutes les listes)

2. **Modification d'annonce** (`PATCH /listings/:id`)
   - Invalide `cache:/api/v1/listings/:id`
   - Invalide `cache:/api/v1/listings?*`

3. **Suppression d'annonce** (`DELETE /listings/:id`)
   - Invalide `cache:/api/v1/listings/:id`
   - Invalide `cache:/api/v1/listings?*`

**Code d'invalidation** :
```typescript
// src/services/cache.service.ts
async invalidateListingCache(listingId: number) {
    await redisClient.del(`cache:/api/v1/listings/${listingId}`);
    await this.invalidatePattern("cache:/api/v1/listings?*");
}
```

---

## 🔒 Contrôle d'Accès et Permissions

### Matrice des Permissions

| Action | Guest | User | Host | Co-Host (can_edit) | Co-Host (no edit) |
|--------|-------|------|------|--------------------|-------------------|
| Voir annonces | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer annonce | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modifier annonce | ❌ | ❌ | ✅ (own) | ✅ | ❌ |
| Supprimer annonce | ❌ | ❌ | ✅ (own) | ❌ | ❌ |
| Créer réservation | ❌ | ✅ | ✅ | ✅ | ✅ |
| Voir messages | ❌ | ✅ (own) | ✅ (own) | ✅ (if perm) | ❌ |

### Implémentation

**Vérification Host** :
```typescript
// src/services/listing.service.ts:8-17
const { data: profile } = await supabase
    .from("profiles")
    .select("is_host")
    .eq("id", userId)
    .single();

if (!profile?.is_host) {
    throw new ForbiddenError("Only hosts can create listings");
}
```

**Vérification Co-Host** :
```typescript
// src/services/listing.service.ts:128-150
private async checkEditPermission(listingId: number, userId: string): Promise<boolean> {
    // 1. Check if main host
    const { data: listing } = await supabase
        .from("listings")
        .select("host_id")
        .eq("id", listingId)
        .single();

    if (listing?.host_id === userId) return true;

    // 2. Check if co-host with permission
    const { data: coHost } = await supabase
        .from("co_hosts")
        .select("can_edit_listing")
        .eq("listing_id", listingId)
        .eq("co_host_id", userId)
        .single();

    return coHost?.can_edit_listing || false;
}
```

---

## 📊 Flow de Données Complet (Exemple: Créer une Réservation)

```
CLIENT                 BACKEND                 REDIS           SUPABASE
  │                       │                      │                 │
  │ POST /bookings        │                      │                 │
  │ {listing_id,dates}    │                      │                 │
  ├──────────────────────>│                      │                 │
  │                       │                      │                 │
  │                  [1. Validation.middleware]  │                 │
  │                       ├─ Zod schema check   │                 │
  │                       │  ✅ Valid            │                 │
  │                       │                      │                 │
  │                  [2. Auth.middleware]        │                 │
  │                       ├─ Extract JWT token   │                 │
  │                       │                      │ getUser(token)  │
  │                       ├──────────────────────┼────────────────>│
  │                       │                      │    user data    │
  │                       │<─────────────────────┼─────────────────┤
  │                       │  ✅ req.user set     │                 │
  │                       │                      │                 │
  │                  [3. BookingService.create]  │                 │
  │                       │                      │ Check listing   │
  │                       ├──────────────────────┼────────────────>│
  │                       │                      │  listing exists │
  │                       │<─────────────────────┼─────────────────┤
  │                       │                      │ Check conflicts │
  │                       ├──────────────────────┼────────────────>│
  │                       │                      │   no conflicts  │
  │                       │<─────────────────────┼─────────────────┤
  │                       │                      │ INSERT booking  │
  │                       ├──────────────────────┼────────────────>│
  │                       │                      │   booking created│
  │                       │<─────────────────────┼─────────────────┤
  │                       │                      │                 │
  │                  [4. CacheService.invalidate]│                 │
  │                       ├─ DEL cache:bookings  │                 │
  │                       ├─────────────────────>│                 │
  │                       │      ✅ Cache cleared│                 │
  │                       │<─────────────────────┤                 │
  │                       │                      │                 │
  │  201 Created          │                      │                 │
  │  {success,data}       │                      │                 │
  │<──────────────────────┤                      │                 │
  │                       │                      │                 │
```

---

## 🚀 Évolutivité et Scalabilité

### Préparation pour la Montée en Charge

**Actuellement** : Monolithe Express (1 instance)

**Futur (scalabilité horizontale)** :
```
                    ┌─────────────────┐
                    │  LOAD BALANCER  │
                    │   (Nginx/Caddy) │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │ Backend 1 │     │ Backend 2 │     │ Backend 3 │
    │ (Express) │     │ (Express) │     │ (Express) │
    └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  REDIS CLUSTER  │
                    │  (Shared cache) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    SUPABASE     │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

**Avantages de l'architecture actuelle** :
- ✅ Stateless (pas de session en mémoire)
- ✅ JWT dans cookies (partageable entre instances)
- ✅ Cache Redis centralisé
- ✅ Ready pour Docker + Kubernetes

---

## 📁 Structure des Fichiers

```
minibnb-groupA-backend/
├── src/
│   ├── app.ts                          # 🚀 Point d'entrée Express
│   │
│   ├── config/                         # ⚙️ Configuration
│   │   ├── env.ts                      # Variables d'environnement (dotenv + Zod)
│   │   ├── supabase.ts                 # Client Supabase
│   │   ├── redis.ts                    # Client Redis
│   │   ├── cookies.ts                  # Config cookies JWT
│   │   └── swagger.ts                  # Config OpenAPI/Swagger
│   │
│   ├── middlewares/                    # 🔧 Middlewares Express
│   │   ├── auth.middleware.ts          # Authentification JWT (cookie + bearer)
│   │   ├── validation.middleware.ts    # Validation Zod
│   │   ├── cache.middleware.ts         # Cache Redis (serveur)
│   │   ├── http-cache.middleware.ts    # Cache HTTP (navigateur) 🆕
│   │   └── error.middleware.ts         # Gestionnaire d'erreurs centralisé
│   │
│   ├── routes/                         # 🛣️ Routes API
│   │   ├── index.ts                    # Router principal (/api)
│   │   └── v1/                         # Version 1 de l'API
│   │       ├── index.ts                # Router v1 (/api/v1)
│   │       ├── auth.routes.ts          # /auth (signup, login, refresh)
│   │       ├── listing.routes.ts       # /listings (CRUD)
│   │       ├── booking.routes.ts       # /bookings (create, list)
│   │       ├── profile.routes.ts       # /profiles (read, update)
│   │       ├── message.routes.ts       # /conversations (messages)
│   │       └── cohost.routes.ts        # /cohosts (permissions)
│   │
│   ├── services/                       # 🧠 Logique métier
│   │   ├── auth.service.ts             # Authentification (Supabase)
│   │   ├── listing.service.ts          # CRUD annonces + permissions
│   │   ├── booking.service.ts          # Réservations + validation dates
│   │   ├── message.service.ts          # Conversations
│   │   └── cache.service.ts            # Invalidation cache Redis
│   │
│   ├── validators/                     # ✅ Schémas de validation Zod
│   │   ├── user.validator.ts           # Signup, login
│   │   ├── listing.validator.ts        # Create/update listing
│   │   ├── booking.validator.ts        # Create booking
│   │   └── message.validator.ts        # Send message
│   │
│   ├── types/                          # 📦 Types TypeScript
│   │   ├── listing.types.ts
│   │   ├── booking.types.ts
│   │   └── ...
│   │
│   └── utils/                          # 🛠️ Utilitaires
│       ├── errors.ts                   # Classes d'erreurs (AppError, NotFoundError, etc.)
│       └── response.ts                 # Format de réponse uniforme (sendSuccess)
│
├── tests/                              # 🧪 Tests Jest
│   ├── routes/v1/                      # Tests d'intégration (routes)
│   │   ├── auth.routes.test.ts
│   │   ├── listing.routes.test.ts
│   │   ├── booking.routes.test.ts
│   │   └── message.routes.test.ts
│   └── services/                       # Tests unitaires (services)
│       └── auth.service.test.ts
│
├── .github/workflows/                  # 🤖 CI/CD
│   └── deploy.yml                      # Déploiement automatique
│
├── package.json                        # 📦 Dépendances npm
├── tsconfig.json                       # ⚙️ Config TypeScript
├── jest.config.ts                      # 🧪 Config Jest
├── Dockerfile                          # 🐳 Image Docker
├── .env.example                        # 📝 Exemple variables d'env
│
├── README.md                           # 📚 Documentation principale 🆕
├── ARCHITECTURE.md                     # 🏗️ Documentation architecture 🆕
├── AUDIT.md                            # 📋 Rapport d'audit technique
└── DEPLOYMENT.md                       # 🚀 Guide de déploiement
```

---

## 🔍 Points Techniques Importants

### 1. Gestion des Erreurs

Toutes les erreurs passent par `error.middleware.ts` :
```typescript
AppError (statusCode, message, errors?)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
└── ConflictError (409)
```

### 2. Validation des Données

**Toutes** les routes POST/PATCH utilisent Zod :
```typescript
router.post("/", validate(createListingSchema), async (req, res) => {
    // req.body est déjà validé et typé
});
```

### 3. Authentification

JWT géré par Supabase :
- Access token : 1h (cookie httpOnly)
- Refresh token : 7 jours (cookie httpOnly)
- Rotation automatique des tokens

### 4. Cache

Stratégie multi-niveaux :
- Navigateur : Cache-Control + ETags
- Serveur : Redis avec TTL
- Invalidation : Pattern matching

---

## 📚 Ressources Externes

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Zod Schema Validation](https://zod.dev/)
- [Redis Caching](https://redis.io/docs/manual/client-side-caching/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Dernière mise à jour** : 15 janvier 2026
```

---

#### ✅ Validation de la Solution

**Test 1 : Vérifier que les fichiers sont créés**
```bash
ls -la README.md ARCHITECTURE.md
# Devrait afficher les deux fichiers
```

**Test 2 : Vérifier la documentation Markdown**
```bash
# Installer un viewer Markdown (optionnel)
npm install -g markdown-preview

# Prévisualiser
markdown-preview README.md
markdown-preview ARCHITECTURE.md
```

**Test 3 : Valider les liens internes**
```bash
# Vérifier que les liens fonctionnent
grep -r "\[.*\](.*\.md)" README.md ARCHITECTURE.md
```

**Test 4 : Accessibilité pour les nouveaux développeurs**
- Un nouveau dev devrait pouvoir installer et lancer le projet en < 10 min
- Tester avec `pnpm install && pnpm dev`

---

### 🟡 PRIORITÉ 3 : Ajouter le Rate Limiting

#### 📋 Contexte Technique

**Problème actuel** :
- Pas de protection contre les attaques par force brute
- Pas de limite sur le nombre de requêtes par IP
- Vulnérable au spam et aux abus

**Solution à implémenter** :
Utiliser `express-rate-limit` pour limiter les requêtes

---

#### 📝 Étape 1 : Installer la dépendance

```bash
pnpm add express-rate-limit
pnpm add -D @types/express-rate-limit
```

---

#### 📝 Étape 2 : Créer le Middleware Rate Limit

**Fichier à créer** : `src/middlewares/rate-limit.middleware.ts`

```typescript
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Rate limiter général (toutes les routes)
 * 100 requêtes par 15 minutes par IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite: 100 requêtes par fenêtre
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: () => env.NODE_ENV === "test", // Désactiver en test
});

/**
 * Rate limiter strict pour l'authentification
 * 5 tentatives par 15 minutes par IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite: 5 tentatives de login/signup
    message: {
        success: false,
        message: "Too many authentication attempts, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
});

/**
 * Rate limiter pour les créations de contenu
 * 10 créations par heure par IP
 */
export const creationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // Limite: 10 créations
    message: {
        success: false,
        message: "Too many creations, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
});
```

---

#### 📝 Étape 3 : Appliquer le Rate Limiting

**Fichier à modifier** : `src/app.ts`

```typescript
import { generalLimiter } from "./middlewares/rate-limit.middleware";

// Après les middlewares globaux (ligne 50)
app.use(generalLimiter); // Rate limiting global
```

**Fichier à modifier** : `src/routes/v1/auth.routes.ts`

```typescript
import { authLimiter } from "../../middlewares/rate-limit.middleware";

// Appliquer sur les routes d'authentification
router.post("/signup", authLimiter, validate(signupSchema), async (req, res, next) => {
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
```

**Fichier à modifier** : `src/routes/v1/listing.routes.ts`

```typescript
import { creationLimiter } from "../../middlewares/rate-limit.middleware";

// Appliquer sur la création d'annonces
router.post("/", authenticate, creationLimiter, validate(createListingSchema), async (req, res, next) => {
```

---

#### ✅ Validation de la Solution

**Test 1 : Tester le rate limiting auth**
```bash
# Faire 6 requêtes de login (limite: 5)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# La 6ème requête devrait retourner 429 Too Many Requests
```

**Test 2 : Vérifier les headers**
```bash
curl -I http://localhost:5000/api/v1/listings

# Devrait afficher :
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: 1642253400
```

---

### 🟢 PRIORITÉ 4 : Ajouter du Logging Structuré

#### 📋 Contexte Technique

**Problème actuel** :
- Utilisation de `console.log()` et `console.error()`
- Logs non structurés, difficiles à parser
- Pas de niveaux de log (debug, info, warn, error)
- Pas de centralisation des logs

**Solution à implémenter** :
Utiliser Winston pour des logs structurés en JSON

---

#### 📝 Étape 1 : Installer Winston

```bash
pnpm add winston
pnpm add -D @types/winston
```

---

#### 📝 Étape 2 : Créer le Logger

**Fichier à créer** : `src/config/logger.ts`

```typescript
import winston from "winston";
import { env } from "./env";

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    format: logFormat,
    defaultMeta: { service: "minibnb-backend" },
    transports: [
        // Fichier pour les erreurs
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: "logs/combined.log",
        }),
    ],
});

// En développement, logger aussi dans la console
if (env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

// Ne pas logger en mode test
if (env.NODE_ENV === "test") {
    logger.transports.forEach((t) => (t.silent = true));
}

export default logger;
```

---

#### 📝 Étape 3 : Remplacer console.log par logger

**Fichier à modifier** : `src/app.ts`

```typescript
import logger from "./config/logger";

// Remplacer ligne 103-104
logger.info(`Server running on http://localhost:${env.PORT}`);
logger.info(`Environment: ${env.NODE_ENV}`);

// Remplacer ligne 107
logger.error("Failed to start server:", error);
```

**Fichier à modifier** : `src/middlewares/error.middleware.ts`

```typescript
import logger from "../config/logger";

// Remplacer ligne 35
logger.error("Unhandled error:", { error: error.message, stack: error.stack });
```

**Fichier à modifier** : `src/middlewares/cache.middleware.ts`

```typescript
import logger from "../config/logger";

// Remplacer ligne 26
logger.error("Cache error:", error);
```

---

#### 📝 Étape 4 : Logger les requêtes HTTP

**Fichier à créer** : `src/middlewares/logger.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;

        logger.info("HTTP Request", {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
    });

    next();
};
```

**Fichier à modifier** : `src/app.ts`

```typescript
import { requestLogger } from "./middlewares/logger.middleware";

// Ajouter après les middlewares globaux (ligne 50)
app.use(requestLogger); // Logger les requêtes
```

---

#### ✅ Validation de la Solution

**Test 1 : Vérifier les logs**
```bash
# Lancer le serveur
pnpm dev

# Faire une requête
curl http://localhost:5000/api/v1/listings

# Vérifier les logs
cat logs/combined.log | tail -5
```

**Test 2 : Format JSON**
```bash
# Les logs devraient être en JSON
cat logs/combined.log | jq .
```

**Test 3 : Filtrer par niveau**
```bash
# Voir seulement les erreurs
cat logs/error.log
```

---

## 📊 Checklist Finale de Résolution

### ✅ À Faire

- [ ] **Cache HTTP** : Créer `src/middlewares/http-cache.middleware.ts`
- [ ] **Cache HTTP** : Modifier `src/routes/v1/listing.routes.ts` (2 endroits)
- [ ] **Cache HTTP** : Appliquer sur les autres routes GET
- [ ] **README.md** : Créer le fichier avec le contenu fourni
- [ ] **ARCHITECTURE.md** : Créer le fichier avec le contenu fourni
- [ ] **Rate Limiting** : Installer `express-rate-limit`
- [ ] **Rate Limiting** : Créer `src/middlewares/rate-limit.middleware.ts`
- [ ] **Rate Limiting** : Appliquer sur `src/app.ts` et routes sensibles
- [ ] **Logging** : Installer `winston`
- [ ] **Logging** : Créer `src/config/logger.ts`
- [ ] **Logging** : Remplacer tous les `console.log` par `logger`
- [ ] **Logging** : Créer `src/middlewares/logger.middleware.ts`

### ✅ Tests de Validation

- [ ] Tester les headers Cache-Control avec `curl -I`
- [ ] Tester la réponse 304 Not Modified avec ETags
- [ ] Vérifier que README.md et ARCHITECTURE.md sont lisibles
- [ ] Tester le rate limiting (429 après limite)
- [ ] Vérifier les logs JSON dans `logs/combined.log`
- [ ] Exécuter `pnpm test` (tous les tests passent)
- [ ] Exécuter `pnpm build` (build réussit)

---

**Note pour Gemini ou autre assistant** :
Ce guide contient **tout le code nécessaire** pour résoudre les problèmes identifiés. Vous pouvez copier-coller directement les exemples de code fournis. Chaque section inclut :
- Le contexte technique complet
- Les fichiers à créer/modifier avec chemins exacts
- Le code complet prêt à utiliser
- Les commandes de test pour valider

Suivez les étapes dans l'ordre de priorité (🔴 puis 🟡 puis 🟢) pour un impact maximal.

---

## 📂 Structure du Projet

```
minibnb-groupA-backend/
├── src/
│   ├── app.ts                    # Point d'entrée Express
│   ├── config/
│   │   ├── env.ts               # Variables d'environnement
│   │   ├── supabase.ts          # Client Supabase
│   │   ├── redis.ts             # Client Redis
│   │   ├── cookies.ts           # Config cookies JWT
│   │   └── swagger.ts           # Config OpenAPI
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Authentification JWT
│   │   ├── validation.middleware.ts # Validation Zod
│   │   ├── cache.middleware.ts  # Cache Redis
│   │   └── error.middleware.ts  # Gestion erreurs
│   ├── routes/
│   │   ├── index.ts             # Router principal
│   │   └── v1/                  # Routes version 1
│   │       ├── auth.routes.ts
│   │       ├── listing.routes.ts
│   │       ├── booking.routes.ts
│   │       └── ...
│   ├── services/
│   │   ├── auth.service.ts      # Logique authentification
│   │   ├── listing.service.ts   # Logique annonces
│   │   ├── booking.service.ts   # Logique réservations
│   │   └── cache.service.ts     # Invalidation cache
│   ├── validators/
│   │   ├── user.validator.ts    # Schémas Zod users
│   │   ├── listing.validator.ts # Schémas Zod annonces
│   │   └── ...
│   ├── types/                   # Types TypeScript
│   └── utils/
│       ├── errors.ts            # Classes d'erreurs
│       └── response.ts          # Format réponses
├── tests/
│   ├── routes/v1/               # Tests routes
│   └── services/                # Tests services
├── package.json                 # Dépendances
├── jest.config.ts               # Config Jest
├── tsconfig.json                # Config TypeScript
├── Dockerfile                   # Image Docker
└── DEPLOYMENT.md                # Guide déploiement
```

---

## 🔍 Technologies Utilisées

| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | ≥20.0.0 | Runtime JavaScript |
| TypeScript | 5.9.3 | Typage statique |
| Express.js | 5.2.1 | Framework web |
| Supabase | 2.90.1 | Base de données + Auth JWT |
| Redis | 5.10.0 | Cache serveur |
| Zod | 4.3.5 | Validation schémas |
| Jest | 30.2.0 | Tests unitaires |
| Supertest | 7.2.2 | Tests HTTP |
| Swagger | 6.2.8 | Documentation API |
| Helmet | 8.1.0 | Sécurité HTTP |
| CORS | 2.8.5 | Cross-Origin Resource Sharing |

---

## ✅ Conclusion

Le backend MiniBnB est **globalement conforme** aux exigences techniques avec un score de **84%**.

### Points forts majeurs
- ✅ API REST très bien structurée et cohérente
- ✅ Sécurité JWT solide avec refresh tokens
- ✅ Validation stricte des données (Zod)
- ✅ Architecture versionnable et évolutive
- ✅ Tests automatisés en place
- ✅ Documentation Swagger complète

### Points critiques à adresser
- ❌ **Cache navigateur** : Ajouter les headers HTTP (Cache-Control, ETag)
- ❌ **Documentation** : Créer ARCHITECTURE.md et README.md

### Recommandation finale
Le backend est **prêt pour la production** après implémentation des headers de cache HTTP. Les autres améliorations peuvent être faites de manière itérative.

---

**Signature** : Audit réalisé par Claude
**Date** : 15 janvier 2026
**Version** : 1.0.0
