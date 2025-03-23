# Application d'appels WebRTC avec Agora

Application de visioconférence en temps réel utilisant la technologie WebRTC via le SDK Agora.

![Capture d'écran de l'application](https://via.placeholder.com/800x450.png?text=Application+WebRTC+Agora)

## Fonctionnalités

- ✅ Appels audio/vidéo en temps réel multi-utilisateurs
- ✅ Partage d'écran
- ✅ Chat textuel intégré
- ✅ Activation/désactivation du microphone et de la caméra
- ✅ Monitoring de la qualité réseau en temps réel
- ✅ Interface utilisateur intuitive et responsive
- ✅ Notifications visuelles des événements
- ✅ Tests audio intégrés

## Technologies utilisées

- **Frontend**:
  - HTML5, CSS3 pour l'interface utilisateur
  - JavaScript pour la logique client
  - SDK Agora WebRTC pour les connexions en temps réel
  - Font Awesome pour les icônes

- **Backend**:
  - Node.js comme environnement d'exécution
  - Express.js comme framework serveur
  - dotenv pour la gestion des variables d'environnement
  - cors pour gérer les requêtes cross-origin

## Prérequis

- Node.js (v14 ou supérieur)
- NPM (v6 ou supérieur)
- Un compte Agora et un App ID (gratuit pour commencer)
- Un navigateur moderne (Chrome, Firefox, Edge)

## Installation

### 1. Clonez ce dépôt
```
git clone https://github.com/dastou/toip_agora.git
cd toip_agora
```

### 2. Installez les dépendances
```
npm install
```

Cette commande installera toutes les dépendances listées dans le fichier `package.json`:
- express
- cors
- dotenv
- (autres dépendances nécessaires)

### 3. Installation de ngrok (pour les tests entre ordinateurs)

#### Windows
```
# Avec npm (recommandé)
npm install -g ngrok

# Ou avec chocolatey
choco install ngrok
```

#### macOS
```
# Avec npm
npm install -g ngrok

# Ou avec Homebrew
brew install ngrok
```

#### Linux
```
# Avec npm
npm install -g ngrok

# Ou avec snap
snap install ngrok
```

Après installation, vous devrez vous authentifier avec votre token ngrok:
```
ngrok authtoken votre_token_ngrok
```
Vous pouvez obtenir un token en créant un compte sur [ngrok.com](https://ngrok.com/).

### 4. Configurez les variables d'environnement (voir section suivante)

### 5. Démarrez le serveur
```
npm run dev
```

### 6. Accédez à l'application à l'adresse `http://localhost:3000`

## Dépendances du projet

Toutes les dépendances du projet sont spécifiées dans le fichier `package.json`. Voici les principales:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

Si vous avez besoin d'exporter une liste de dépendances comme dans un fichier `requirements.txt` (format Python), vous pouvez utiliser cette commande:

```bash
npm list --prod --depth=0 > dependencies.txt
```

## Configuration

### Variables d'environnement

Pour faire fonctionner l'application, vous devez configurer les variables d'environnement nécessaires:

1. Créez un fichier `.env` à la racine du projet avec le contenu suivant:
   ```
   PORT=3000
   AGORA_APP_ID=votre_clé_app_id_agora
   ```

2. Remplacez `votre_clé_app_id_agora` par votre propre clé App ID obtenue sur le [Dashboard Agora](https://console.agora.io/).

**Note**: Le fichier `.env` contient des informations sensibles et ne devrait pas être partagé ou poussé sur GitHub.

### Obtention d'un App ID Agora

1. Créez un compte sur [Agora.io](https://console.agora.io/)
2. Créez un nouveau projet dans la console Agora
3. Copiez l'App ID généré
4. Collez-le dans votre fichier `.env`

## Utilisation

### Test en local

1. Entrez un nom de canal dans le champ prévu
2. Cliquez sur "Rejoindre l'appel"
3. Autorisez l'accès à votre caméra et microphone lorsque demandé
4. Utilisez les boutons de contrôle pour activer/désactiver votre micro et caméra
5. Pour tester avec plusieurs participants, ouvrez l'application dans plusieurs onglets

### Test entre deux ordinateurs

Pour tester l'application entre deux ordinateurs, vous avez deux options:

#### Option 1: Utiliser ngrok (recommandé pour les tests rapides)

1. Lancez votre serveur avec `npm run dev`
2. Dans un autre terminal, exécutez `ngrok http 3000`
3. Copiez l'URL HTTPS générée par ngrok (ex: `https://abc123.ngrok.io`)
4. Partagez cette URL avec l'autre participant
5. Les deux participants se connectent à cette URL et rejoignent le même canal

#### Option 2: Déployer l'application

Vous pouvez déployer l'application sur une plateforme comme Heroku, Vercel, ou tout autre service d'hébergement.

## Structure du projet

```
projet-webrtc-agora/
├── public/
│   ├── css/
│   │   └── style.css       // Styles de l'interface
│   ├── js/
│   │   └── main.js         // Logique client et intégration Agora
│   └── index.html          // Structure de l'interface utilisateur
├── .env                    // Variables d'environnement (non versionnées)
├── .gitignore              // Fichiers exclus du versionnement
├── package.json            // Dépendances et scripts
├── README.md               // Documentation du projet
└── server.js               // Serveur Express
```

## Comment ça fonctionne

### Architecture

```
Client (Navigateur) <---> Serveur Node.js <---> Services Agora
       |                        |                   |
   Interface          Distribution des pages    Signalisation
    (HTML/CSS)        Configuration (API Key)    Streaming A/V
    JavaScript         Gestion sessions         Routage P2P
```

### Flux de fonctionnement

1. Le serveur Node.js fournit l'application web au navigateur
2. L'application initialise le SDK Agora dans le navigateur
3. Quand un utilisateur rejoint un canal:
   - Une connexion est établie avec les serveurs de signalisation Agora
   - L'utilisateur publie ses flux audio/vidéo
   - Les autres utilisateurs sont notifiés et s'abonnent aux flux
4. Agora gère l'établissement des connexions P2P quand possible, ou relaye le trafic si nécessaire

## Dépannage

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Erreur "Invalid App ID" | Vérifiez que votre App ID Agora est correct dans le fichier `.env` |
| Pas d'accès à la caméra/micro | Vérifiez les permissions du navigateur et que vos périphériques sont connectés |
| Qualité vidéo médiocre | Vérifiez votre connexion internet, fermez les applications qui utilisent beaucoup de bande passante |
| L'application ne se charge pas | Vérifiez que le serveur est bien démarré et accessible |
| Son unidirectionnel | Vérifiez que le micro n'est pas en sourdine et que le volume n'est pas à zéro |
| Erreur avec ngrok | Vérifiez que vous avez bien installé et configuré ngrok, essayez de redémarrer le tunnel |

### Logging et Debug

L'application inclut des logs détaillés dans la console du navigateur. Pour déboguer:

1. Ouvrez les outils de développement du navigateur (F12)
2. Consultez les logs dans l'onglet "Console"
3. Vérifiez les erreurs réseau dans l'onglet "Réseau"

## Développement et extension

### Ajout de nouvelles fonctionnalités

1. Créez une nouvelle branche pour votre fonctionnalité:
   ```
   git checkout -b feature/nom-de-la-fonctionnalite
   ```

2. Implémentez votre fonctionnalité

3. Poussez votre branche et créez une Pull Request:
   ```
   git push origin feature/nom-de-la-fonctionnalite
   ```

### Suggestions d'améliorations

- Authentification des utilisateurs
- Enregistrement des appels
- Floutage d'arrière-plan
- Système de salles virtuelles avec mot de passe
- Tableau blanc collaboratif

## Ressources

- [Documentation Agora Web SDK](https://docs.agora.io/en/Video/API%20Reference/web_ng/index.html)
- [Guide WebRTC](https://webrtc.org/getting-started/overview)
- [Documentation Express.js](https://expressjs.com/)
- [Documentation ngrok](https://ngrok.com/docs)

## Licence

[MIT](LICENSE)

## Auteur

[Astou Diallo]

---

N'hésitez pas à ouvrir une issue si vous rencontrez des problèmes ou avez des suggestions d'amélioration !