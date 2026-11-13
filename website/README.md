# Eureka — base web 2026–2027

Prototype local pour la façade commerciale d’Eureka Corporation, dans un univers de fiction. Ouvrir **index.html** dans un navigateur : aucune installation ni compilation nécessaire.

## Application client

Ouvrir **client/index.html**, ou le lien « Espace client » de la vitrine. L’application est indépendante de la présentation commerciale et dispose de ses propres styles et traductions.

- Tableau de bord avec quatre services fictifs et des métriques de démonstration.
- Gestion des services : recherche, filtre, détails, mise en pause et réactivation locales.
- Compte de démonstration avec profil modifiable ; aucune authentification réelle.
- Chatbot scénarisé, sans modèle d’IA, API ou envoi réseau des messages.
- Support : création et consultation de demandes fictives conservées dans le navigateur.
- Six langues, polices japonaises et chinoises adaptées, menu mobile et navigation clavier.

Les données de l’app sont stockées sous `eureka.client.demo.v1`. La préférence de langue `eureka.locale` est partagée avec la vitrine. Utiliser des coordonnées fictives. Aucun serveur, compte réel, service réel ou système de messagerie n’est connecté. Les feuilles de polices sont chargées depuis Adobe Fonts et Google Fonts. Les messages de validation natifs suivent la langue du navigateur.

Fichiers de l’app : `client/index.html`, `client/client.css`, `client/client.js`, `client/locales.js`.

Vérifications sans dépendance avec Node : `node client/tests.cjs`. Elles couvrent les cinq vues dans les six langues, les changements d’état, la persistance locale, le chatbot et l’échappement des saisies. Un contrôle visuel dans le navigateur reste nécessaire.

## Périmètre actuel

- Présentation publique d’Eureka et repères historiques issus du document fourni.
- Catalogue de quatre offres proposées pour le prototype, filtrable par public.
- Sélection d’un service et formulaire de projet avec validation native.
- Enregistrement et restauration d’un brouillon dans le navigateur, export JSON et effacement.
- Mise en page responsive, navigation clavier et prise en compte du mouvement réduit.

Les demandes ne sont pas envoyées. Il n’y a pas encore de serveur, d’authentification, de paiement ou de messagerie. Le brouillon est propre au navigateur et peut contenir des coordonnées : utiliser des données fictives pour les essais. Le stockage peut être indisponible selon les réglages du navigateur, notamment en ouverture directe de fichier ; l’export reste disponible.

## Répartition des fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure et textes des sections |
| `styles.css` | Tokens visuels dans `:root`, composants et responsive |
| `services.js` | Données des offres et publics concernés |
| `i18n.js` | Traductions et sélection de langue (EN-US, FR-FR, ES-ES, DE-DE, JA-JP, ZH-CN) |
| `app.js` | Filtres, sélection et brouillons |
| `navigation.js` | Gestion clavier et menu mobile de la barre fixe, recouverte au départ par le calque du header |
| `hero.js` | Rotation des quatre valeurs du hero, traductions, pause et mouvement réduit |

## Collaboration Figma / développement

Palette officielle : **Apricot `#fcbf75`**, **Peach `#e3987c`**, **Fig `#9457e7`**. Les trois couleurs sont centralisées dans `:root` (`--apricot`, `--peach`, `--fig`), avec des neutres complémentaires pour la lisibilité. Apricot habille le visuel principal, Peach les surfaces secondaires, Fig les boutons et accents.

Le graphisme actuel est provisoire. Les variables en tête de `styles.css` centralisent couleurs, typographie, largeur et arrondis. Pour l’intégration des maquettes, prévoir les écrans mobile et bureau, les styles de texte, espacements, composants et états (focus, erreur, sélection, confirmation). Exporter les logos et icônes en SVG, les images en WebP/PNG.

## Contenu de l’univers

Éléments établis : création du NIAR en 1962, transformation en Eureka Corporation en 1973, indépendance en 1981, plus de 30 établissements, informatique avancée, microélectronique, réseaux et télécommunications. Les offres commerciales et le parcours client sont des propositions à valider. Les activités confidentielles et le BSA ne sont pas présentés sur la façade commerciale.

## Suite du développement

Le sélecteur de langue traduit les sections, le catalogue, le formulaire et les messages applicatifs sans recharger la page. Le choix est mémorisé dans le navigateur si le stockage est disponible. Le français est la langue initiale. JP correspond au japonais et CH au chinois simplifié. Les messages de validation natifs (champs obligatoires, format e-mail) suivent la langue du navigateur. Les traductions sont une première version à relire avant publication.

Intégrer les maquettes Figma, préciser le catalogue et les parcours, puis connecter un serveur pour la réception réelle des demandes et le suivi client. Aucun hébergement n’est configuré dans cette base de travail.
