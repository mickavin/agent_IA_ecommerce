# Configuration AWS S3 pour Export CSV Automatique

## Vue d'ensemble

Le système Younz génère automatiquement un fichier CSV après chaque synchronisation Shopify. Ce CSV peut être sauvegardé automatiquement sur AWS S3 en configurant les variables d'environnement appropriées.

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Configuration AWS S3
AWS_ACCESS_KEY_ID=votre_access_key_id
AWS_SECRET_ACCESS_KEY=votre_secret_access_key
AWS_S3_BUCKET_NAME=nom-de-votre-bucket
AWS_REGION=eu-west-3
```

## Étapes de configuration

### 1. Créer un bucket S3

```bash
# Via AWS CLI
aws s3 mb s3://younz-csv-exports --region eu-west-3
```

### 2. Créer un utilisateur IAM

1. Accédez à la console AWS IAM
2. Créez un nouvel utilisateur avec accès programmatique
3. Attachez la politique suivante :

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::younz-csv-exports/*"
        }
    ]
}
```

### 3. Configurer les permissions du bucket

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCSVUpload",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::VOTRE_ACCOUNT_ID:user/younz-csv-user"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::younz-csv-exports/*"
        }
    ]
}
```

## Format des fichiers CSV

Les fichiers sont automatiquement nommés selon le format :
```
shopify-products-YYYY-MM-DDTHH-MM-SS.csv
```

### Colonnes incluses :

- `id` : ID unique du produit
- `product_title` : Titre complet du produit
- `handle` : URL slug du produit
- `category` : Catégorie/type de produit
- `vendor` : Marque/fournisseur
- `status` : Statut (Actif/Archivé)
- `price` : Prix moyen
- `stock` : Stock total
- `thumbnail_url` : URL de l'image principale
- `images` : URLs de toutes les images (séparées par `;`)
- `sizes` : Tailles disponibles (séparées par `;`)
- `colors` : Couleurs disponibles (séparées par `;`)
- `tags` : Tags du produit (séparés par `;`)
- `description` : Description du produit
- `availableForSale` : Disponible à la vente (true/false)
- `variant_count` : Nombre de variants
- `variants_details` : Détails complets des variants (JSON)

## Comportement par défaut

- **Sans configuration S3** : Le CSV sera généré localement et proposé en téléchargement
- **Avec configuration S3** : Le CSV sera uploadé automatiquement sur S3 ET disponible en téléchargement
- **Erreur S3** : Le système continuera à fonctionner avec le téléchargement local

## Surveillance et logs

Les logs incluent :
- ✅ Génération CSV réussie
- 📄 Taille du fichier et statistiques
- ☁️ Statut de l'upload S3
- ⚠️ Erreurs de configuration

## Dépannage

### Erreurs communes :

1. **"Configuration AWS manquante"**
   - Vérifiez que toutes les variables d'environnement sont définies

2. **"Access Denied"**
   - Vérifiez les permissions IAM et du bucket

3. **"Bucket not found"**
   - Assurez-vous que le bucket existe dans la bonne région

4. **"Invalid credentials"**
   - Vérifiez les clés d'accès AWS

### Test de configuration :

```bash
# Tester la configuration AWS CLI
aws s3 ls s3://younz-csv-exports --region eu-west-3
```

## Sécurité

- ❌ Ne jamais committer les clés AWS dans le code
- ✅ Utiliser des variables d'environnement
- ✅ Principe de moindre privilège pour les permissions IAM
- ✅ Activer le versioning sur le bucket S3
- ✅ Configurer la suppression automatique des anciens fichiers (lifecycle policy)

## Exemple de lifecycle policy S3 :

```json
{
    "Rules": [
        {
            "ID": "DeleteOldCSVs",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "shopify-products-"
            },
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
```

---

*Ce guide assure une sauvegarde automatique et sécurisée de vos exports CSV sur AWS S3.* 