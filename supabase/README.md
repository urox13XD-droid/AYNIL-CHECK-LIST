# Mise en route des sessions partagées

## 1. Appliquer le schéma

Dans le projet Supabase **déjà utilisé pour AYNIL Condition Report** (même
projet, une table de plus) : SQL Editor → New query → coller le contenu de
`supabase/schema.sql` → Run.

## 2. Récupérer les clés

Project Settings → API :

- `Project URL`
- clé `anon` `public`

## 3. Configurer l'app

En local, créer `.env.local` à la racine (non versionné) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Sur le déploiement (Vercel ou autre) : mêmes variables dans les réglages du
projet. Ce sont les mêmes valeurs que celles déjà utilisées pour Condition
Report.

## 4. Empêcher la mise en veille du projet Supabase

Les projets gratuits Supabase se mettent en pause après une période sans
activité API. Le workflow `.github/workflows/supabase-keepalive.yml` fait un
ping léger toutes les 3 jours pour l'éviter — il couvre le projet entier
(donc aussi les tables de Condition Report), pas besoin de le dupliquer
ailleurs.

Pour l'activer, sur ce repo GitHub : **Settings → Secrets and variables →
Actions → New repository secret**, ajouter :

- `SUPABASE_URL` — même valeur que `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` — même valeur que `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Le workflow tourne automatiquement ensuite (voir l'onglet **Actions** du
repo pour l'historique des exécutions). Il peut aussi être lancé
manuellement depuis cet onglet (« Run workflow »).
