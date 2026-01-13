# 🚀 Guide de Déploiement

## Configuration des Secrets GitHub

Pour que le déploiement fonctionne correctement, vous devez configurer les secrets suivants dans GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

### Secrets Requis

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DOCKER_PORTAINER_URL` | URL de votre instance Portainer | `https://portainer.example.com` |
| `DOCKER_PORTAINER_USER` | Nom d'utilisateur Portainer | `admin` |
| `DOCKER_PORTAINER_PASSWORD` | Mot de passe Portainer | `***` |
| `PORTAINER_STACK_NAME` | Nom du stack dans Portainer | `minibnb-backend` |
| `SUPABASE_URL` | URL de votre projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | `eyJhbGci...` |
| `FRONTEND_URL` | URL de votre frontend | `https://minibnb.example.com` |
| `BACKEND_URL` | URL de votre backend (pour CORS Swagger) | `https://minibnb-backend.vincentmagnien.com` |
| `REDIS_HOST` | Host Redis | `redis` ou `localhost` |
| `REDIS_PORT` | Port Redis | `6379` |

### Comment ajouter le secret BACKEND_URL

1. Allez sur GitHub → Settings → Secrets and variables → Actions
2. Cliquez sur **New repository secret**
3. Name: `BACKEND_URL`
4. Value: `https://minibnb-backend.vincentmagnien.com`
5. Cliquez sur **Add secret**

## Workflow de Déploiement

### Déclenchement

Le déploiement se déclenche automatiquement lors d'un push sur `main` ou `master`.

### Étapes

1. **Tests** - Exécute tous les tests
   - Si ❌ les tests échouent → Déploiement annulé
   - Si ✅ les tests passent → Continuer

2. **Build Docker** - Construit l'image Docker
   - Tag: `ghcr.io/[owner]/[repo]:latest`
   - Tag: `ghcr.io/[owner]/[repo]:[sha]`

3. **Push vers GitHub Container Registry** - Publie l'image

4. **Déploiement Portainer** - Déploie sur Portainer
   - Crée ou met à jour le stack
   - Injecte les variables d'environnement
   - Pull l'image latest

## Variables d'Environnement en Production

Ces variables sont automatiquement injectées dans votre conteneur Docker:

```bash
NODE_ENV=production
PORT=5000
SUPABASE_URL=[depuis secret]
SUPABASE_ANON_KEY=[depuis secret]
SUPABASE_SERVICE_ROLE_KEY=[depuis secret]
FRONTEND_URL=[depuis secret]
BACKEND_URL=[depuis secret]  # ✨ Nouveau
REDIS_HOST=[depuis secret]
REDIS_PORT=[depuis secret]
```

## Déploiement Manuel

Si vous devez déployer manuellement:

```bash
# 1. Build l'image
docker build -t minibnb-backend .

# 2. Tag l'image
docker tag minibnb-backend ghcr.io/[owner]/minibnb-backend:latest

# 3. Push vers GitHub Container Registry
docker push ghcr.io/[owner]/minibnb-backend:latest

# 4. Mise à jour du stack dans Portainer
# (via l'interface web ou l'API Portainer)
```

## Rollback

En cas de problème, vous pouvez revenir à une version précédente:

1. Trouvez le SHA du commit précédent: `git log --oneline`
2. L'image correspondante est taguée: `ghcr.io/[owner]/[repo]:[sha]`
3. Dans Portainer, modifiez le `docker-compose.prod.yml` pour utiliser ce tag
4. Redéployez le stack

## Vérification Post-Déploiement

Après chaque déploiement, vérifiez:

- ✅ API répond: `https://minibnb-backend.vincentmagnien.com/health`
- ✅ Swagger accessible: `https://minibnb-backend.vincentmagnien.com/docs`
- ✅ Logs Portainer: Pas d'erreurs
- ✅ Tests Swagger: "Try it out" fonctionne

## Troubleshooting

### Le déploiement échoue aux tests

```bash
# Localement, lancez les tests
pnpm test

# Corrigez les tests qui échouent
# Commitez et pushez à nouveau
```

### Le build Docker échoue

```bash
# Testez le build localement
docker build -t minibnb-backend .

# Vérifiez les logs d'erreur
# Corrigez le Dockerfile ou les dépendances
```

### Swagger ne fonctionne pas en production

1. Vérifiez que `BACKEND_URL` est bien défini dans les secrets GitHub
2. Vérifiez les logs du conteneur pour les erreurs CORS
3. Testez avec: `curl -X POST https://minibnb-backend.vincentmagnien.com/api/v1/auth/signup`

## Support

En cas de problème, contactez l'équipe DevOps ou créez une issue.
