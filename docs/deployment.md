# Memoir — Déploiement & Infrastructure

## Stack
- **App** : Next.js (Turbopack) — `/Users/jeremiebenhamou/Desktop/memoir-app`
- **Hébergeur** : Vercel (projet `memoir-app`)
- **Repo GitHub** : `jeremie-oss/memoir-app` (branche `main`)
- **Domaine** : `getyourmemoir.com` (acheté sur GoDaddy)
- **DB / Auth** : Supabase (bypassed en mode démo avec `NEXT_PUBLIC_DEMO_MODE=true`)

---

## Déploiement automatique

Le flux est entièrement automatique :

```
Tu codes → git add -A && git commit -m "..." && git push → Vercel déploie
```

- Push sur `main` → **Production** (`getyourmemoir.com`)
- Push sur toute autre branche → **Preview URL** (pour tester avant de merger)

Vercel est connecté à GitHub depuis le dashboard :
[vercel.com/jeremie-3244s-projects/memoir-app/settings/git](https://vercel.com/jeremie-3244s-projects/memoir-app/settings/git)

---

## Déploiement manuel (si besoin)

```bash
cd /Users/jeremiebenhamou/Desktop/memoir-app

# Preview
vercel

# Production
vercel --prod
```

---

## Domaine getyourmemoir.com

### Registrar
GoDaddy — compte Jérémie

### DNS
Les nameservers ont été délégués à Vercel :
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```
→ Vercel gère tous les enregistrements DNS automatiquement.

### Avant (Netlify — ne plus utiliser)
Le domaine pointait sur Netlify via `dns1-4.p04.nsone.net` (Netlify DNS / AWS eu-central-1).
Cette config est obsolète depuis la migration vers Vercel.

### Vérifier que le domaine est actif
```bash
# NS doivent afficher ns1/ns2.vercel-dns.com
dig getyourmemoir.com NS +short

# A record doit afficher une IP Vercel (76.76.21.21 ou similaire)
dig getyourmemoir.com A +short

# Test HTTP
curl -I https://getyourmemoir.com
```

---

## Variables d'environnement

Gérées dans Vercel dashboard :
[vercel.com/jeremie-3244s-projects/memoir-app/settings/environment-variables](https://vercel.com/jeremie-3244s-projects/memoir-app/settings/environment-variables)

Pour synchroniser en local :
```bash
cd /Users/jeremiebenhamou/Desktop/memoir-app
vercel env pull .env.local
```

Variables clés :
- `OPENROUTER_API_KEY` — clé OpenRouter pour les agents IA
- `NEXT_PUBLIC_DEMO_MODE=true` — bypass Supabase auth en démo
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — base de données
- `MODEL_INTERROGATEUR`, `MODEL_ECRIVAIN`, etc. — modèles par agent (optionnel, fallback inclus)

---

## URLs importantes

| Contexte | URL |
|----------|-----|
| Production | https://getyourmemoir.com |
| Vercel fallback | https://memoir-app-two.vercel.app |
| Vercel dashboard | https://vercel.com/jeremie-3244s-projects/memoir-app |
| GitHub repo | https://github.com/jeremie-oss/memoir-app |
| Supabase | https://supabase.com/dashboard |

---

## Résolution de problèmes

### Le domaine ne répond pas
```bash
dig getyourmemoir.com NS +short   # vérifier les NS
dig getyourmemoir.com A +short    # vérifier l'A record
```
Si les NS ne sont pas `vercel-dns.com` → aller sur GoDaddy et re-configurer.

### Le déploiement Vercel échoue
```bash
vercel logs --prod   # voir les logs de production
```
Ou dans le dashboard : Deployments → cliquer sur le déploiement en erreur.

### Variables d'env manquantes en local
```bash
vercel env pull .env.local
```

### Forcer un redéploiement sans changer le code
```bash
git commit --allow-empty -m "chore: redeploy" && git push
```
