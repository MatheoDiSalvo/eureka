# Eureka

Site vitrine et application client de démonstration d’Eureka Corporation, dans un univers de fiction situé en 2026–2027.

## Ouvrir le projet

Aucune installation nécessaire pour explorer les interfaces :

- **Site vitrine :** ouvrir [`website/index.html`](website/index.html).
- **Application client :** ouvrir [`client/index.html`](client/index.html).

Les deux interfaces sont reliées et proposent six langues : anglais américain, français de France, espagnol d’Espagne, allemand, japonais et chinois simplifié.

## Organisation

```text
website/   Site vitrine, catalogue et animations
client/    Tableau de bord, services, compte, assistant et support
images/    Logos partagés
```

Le projet utilise HTML, CSS et JavaScript sans compilation. Les polices sont chargées depuis Adobe Fonts et Google Fonts. La palette officielle est Apricot `#fcbf75`, Peach `#e3987c` et Fig `#9457e7`.

## Périmètre de la démonstration

L’application permet d’explorer un compte fictif, consulter et mettre en pause des services simulés, personnaliser un profil, dialoguer avec un assistant à réponses prédéfinies et préparer des demandes de support locales.

Il n’y a pas d’authentification réelle, d’IA connectée ni de messagerie. Les modifications sont conservées dans le navigateur avec `localStorage` ; aucune donnée client n’est envoyée. Utiliser des données fictives pour les essais.

## Vérifications

Avec Node.js 24 ou une version compatible :

```sh
node client/tests.cjs
```

Les tests couvrent les cinq vues dans les six langues, les services, le profil, le support, le chatbot, la persistance et l’échappement des saisies. Ils ne remplacent pas une vérification visuelle dans le navigateur.

Le workflow GitHub Actions exécute ces tests et vérifie la syntaxe JavaScript à chaque push et pull request. Il ne publie pas le site.

## Collaboration

Les modifications graphiques se préparent dans Figma puis s’intègrent dans les feuilles CSS. Les fichiers HTML et CSS sont organisés en sections commentées. Les logos sont partagés par les deux interfaces depuis `images/`.
