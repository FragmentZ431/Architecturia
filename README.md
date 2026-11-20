# ZONE-431 DESIGN — version 0.2.1

## Installation et lancement
1. Installer Node.js LTS.
2. Décompresser le dossier.
3. Ouvrir un terminal dans `ZONE-431-DESIGN`.
4. Exécuter `npm install` (connexion Internet nécessaire pour installer les dépendances).
5. Exécuter `npm run start`.

Après installation des dépendances, l'application fonctionne localement. La génération d'un installateur Windows autonome sera ajoutée dans une étape ultérieure.

## Fonctions de cette version
- Tracé des murs par clic-glisser dans le plan 2D.
- Placement des portes, fenêtres, meubles et canalisations par clic.
- Sélection et déplacement des objets.
- Rotation d'un objet sélectionné par saisie d'un angle ou par pas de 15°.
- Suppression d'un objet sélectionné.
- Aperçu 3D synchronisé avec les éléments du plan et navigation orbitale.
- Niveaux indépendants (ajout et changement de niveau).
- Enregistrement et ouverture du projet au format JSON `.z431`.
- Deux styles d'affichage de base.

## Limites connues
Cette version est une première base fonctionnelle, pas encore un logiciel CAO/BIM complet. Les ouvertures ne découpent pas encore automatiquement les murs, les pièces ne sont pas encore détectées automatiquement, et les outils de sculpture, matériaux avancés, éclairage détaillé et caméra cinématique restent à développer. Les niveaux sont gérés séparément mais ne sont pas encore empilés visuellement en 3D.
