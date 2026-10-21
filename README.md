# BH Chasseur – BH AUTOSELECT

Robot qui cherche des voitures aux enchères (Interenchères, Alcopa, Enchères Domaine de l'État), en priorité les **ventes judiciaires** (liquidations, saisies). Il passe 3 fois par jour, estime la marge de chaque voiture et t'envoie une notification sur ton portable quand il trouve une bonne affaire.

- **Appli sur ton téléphone** : `https://TON-PSEUDO.github.io/bh-chasseur/`
- **Réglages** (prix max, marge mini, départements) : fichier `config.json`
- **Lancer une recherche à la main** : onglet *Actions* → *Chasse aux voitures* → *Run workflow*

## Installation (une seule fois, sur ton PC, environ 15 minutes)

1. **Dézippe** `bh-chasseur.zip` (par exemple dans `Bureau\BH Autoselect`).
2. Va sur **github.com** et connecte-toi. En haut à droite, clique sur **+** puis **New repository**.
   - Repository name : `bh-chasseur`
   - Coche **Public** (obligatoire pour que l'appli soit gratuite)
   - Clique sur **Create repository**
3. Sur la page qui s'affiche, clique sur le lien **uploading an existing file**.
   Ouvre le dossier `bh-chasseur` que tu as dézippé, sélectionne **tout son contenu** (`.github`, `docs`, `scraper`, `config.json`, `package.json`, `README.md`, `.gitignore`), puis glisse-le dans la page. Clique ensuite sur **Commit changes**.
   > Vérifie que le dossier `.github` apparaît bien dans la liste. S'il manque : *Add file → Create new file*, tape `.github/workflows/chasse.yml` comme nom, colle le contenu du fichier `chasse.yml`, puis *Commit changes*.
4. **Autorise le robot à enregistrer ses résultats** : *Settings → Actions → General*. Tout en bas, dans *Workflow permissions*, choisis **Read and write permissions**, puis **Save**.
5. **Mets l'appli en ligne** : *Settings → Pages*. Dans *Source*, choisis **Deploy from a branch**. Dans *Branch*, choisis **main** et le dossier **/docs**, puis **Save**. Au bout de 1 à 2 minutes, l'adresse de l'appli s'affiche en haut de la page.
6. **Active les notifications sur le portable** :
   - Installe l'appli **ntfy** (Play Store ou App Store, gratuite).
   - Dans ntfy, touche **+** et abonne-toi au sujet : `bh-autoselect-84c99207`
   - Sur GitHub : *Settings → Secrets and variables → Actions → New repository secret*
     - Name : `NTFY_TOPIC`
     - Secret : `bh-autoselect-84c99207`
     - Clique sur **Add secret**
7. **Premier lancement** : ouvre l'onglet **Actions**. Si GitHub le demande, clique sur *I understand… enable them*. Choisis **Chasse aux voitures**, puis **Run workflow** et encore **Run workflow**. Compte 10 à 20 minutes ; la pastille verte veut dire que c'est terminé.
8. **Installe l'appli sur ton téléphone** : ouvre l'adresse de l'étape 5 dans Chrome, puis **⋮ → Ajouter à l'écran d'accueil** (sur iPhone, dans Safari : Partager → *Sur l'écran d'accueil*).

Ensuite, tout se fait depuis le portable. L'ordinateur peut rester éteint.

## Bon à savoir

- **Cote estimée** : c'est une estimation du prix de revente, calculée d'après le modèle, l'année et le kilométrage. Avant d'enchérir, vérifie toujours avec le bouton **Comparer Leboncoin**, puis tape le prix constaté dans la case : la marge est recalculée.
- Le robot ne parcourt que les pages publiques et ne visite pas les pages que les sites interdisent aux robots. Il fait des pauses entre chaque page.
- Si une source affiche 0 voiture, c'est que son site a changé de présentation. Le fichier `docs/data/debug.json` indique ce que le robot a vu : il suffit d'envoyer son contenu à Claude pour corriger.
- GitHub met en pause les robots planifiés après 60 jours sans activité sur le dépôt. Si ça arrive, relance-le depuis l'onglet *Actions*.
