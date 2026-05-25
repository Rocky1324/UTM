# Simulateur de Résistance des Matériaux (UTM Simulator)

Une application web moderne, interactive et scientifique pour simuler en temps réel des **essais de traction mécanique** sur une machine d'essai universelle virtuelle (UTM). Ce simulateur permet de visualiser le comportement mécanique et les courbes contrainte-déformation de différents matériaux sous sollicitation.

---

## 🚀 Fonctionnalités Clés

- **Visualisation Dynamique (SVG)** : Animation fluide d'une éprouvette de traction de type *dog-bone* s'étirant en temps réel, subissant une striction locale (pour les matériaux ductiles) et se rompant de manière réaliste.
- **Cartographie Thermique des Contraintes** : L'éprouvette change de couleur (du bleu froid au rouge incandescent) en fonction de la concentration locale de la contrainte ($\sigma$).
- **5 Matériaux Prédéfinis** :
  - **Acier (S235)** : Comportement ductile complet avec limite élastique, palier d'écoulement de Lüders, écrouissage et striction.
  - **Aluminium (6061)** : Métal ductile avec transition élasto-plastique continue (sans palier marqué).
  - **Plastique (PVC)** : Comportement très ductile avec étirage important sous contrainte modérée.
  - **Béton standard & Béton + Chaux** : Matériaux fragiles caractérisés par une rupture brute instantanée dans le domaine élastique.
- **Graphique Interactif ($\sigma - \epsilon$)** : Tracé en direct de la courbe contrainte-déformation (via Chart.js) avec affichage automatique des limites caractéristiques ($R_e$, $R_m$) et du point de rupture.
- **Console de Télémétrie en Direct** : Affichage digital précis des valeurs physiques :
  - Force de traction $F$ (en $\text{kN}$)
  - Allongement de l'éprouvette $\Delta L$ (en $\text{mm}$)
  - Contrainte nominale $\sigma$ (en $\text{MPa}$)
  - Déformation relative $\epsilon$ (en $\%$)
- **Contrôles de l'Essai** : Lancement automatique du test, bouton d'urgence "Provoquer une rupture" instantanée, et réinitialisation de la simulation.
- **Exportation des Données & Rapports** :
  - Exportation complète de la série temporelle des points de données en formats **CSV** et **JSON**.
  - Génération et exportation d'un **Rapport d'Expertise PDF** optimisé pour l'impression A4 avec espaces de signature.

---

## 📊 Modélisation Physique & Équations

Le simulateur repose sur des lois de comportement mécanique réelles de la science des matériaux.

### Équations Fondamentales
- **Contrainte Nominale ($\sigma$)** : 
  $$\sigma = \frac{F}{A_0}$$
  *(où $F$ est la force appliquée et $A_0$ la section initiale de l'éprouvette)*
- **Déformation Relative ($\epsilon$)** :
  $$\epsilon = \frac{\Delta L}{L_0}$$
  *(où $\Delta L$ est l'allongement mesuré et $L_0$ la longueur utile initiale)*

### Données Théoriques des Matériaux
| Matériau | Module de Young $E$ (MPa) | Limite Élastique $R_e$ (MPa) | Résistance Traction $R_m$ (MPa) | Déformation à Rupture $\epsilon_f$ | Type de Fracture |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Acier (S235)** | $210\,000$ | $250$ | $450$ | $22\%$ | Cup & Cone (Ductile) |
| **Aluminium (6061)** | $70\,000$ | $150$ | $240$ | $15\%$ | Cup & Cone (Ductile) |
| **Plastique (PVC)** | $2\,000$ | $30$ | $55$ | $50\%$ | Cisaillement à 45° |
| **Béton standard** | $30\,000$ | - | $3.5$ | $0.0117\%$ | Fracture Plate (Fragile) |
| **Béton + Chaux** | $15\,000$ | - | $1.8$ | $0.0120\%$ | Fracture Plate (Fragile) |

---

## 🛠️ Stack Technique

- **Framework** : [React](https://react.dev/) + [Vite](https://vite.dev/) (pour un rechargement à chaud ultra-rapide)
- **Graphiques** : [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Style** : CSS3 Vanilla moderne avec une esthétique orientée tableau de bord scientifique de type Dark Mode, effets de flou (Glassmorphism), ombres incandescents et transitions soignées.

---

## ⚙️ Installation et Lancement Local

### Prérequis
Avoir installé [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée) et `npm`.

### Instructions

1. **Cloner le projet ou le télécharger** :
   ```bash
   git clone https://github.com/Rocky1324/UTM.git
   cd UTM
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement local** :
   ```bash
   npm run dev
   ```
   L'application sera accessible dans votre navigateur à l'adresse suivante : `http://localhost:5173/`

4. **Compiler l'application pour la production** :
   ```bash
   npm run build
   ```
   Les fichiers optimisés seront générés dans le dossier `dist`.

---

## 📝 Licence

Ce projet est conçu dans le cadre d'un laboratoire virtuel d'enseignement des sciences physiques et de la résistance des matériaux (RDM). Tous droits réservés.
