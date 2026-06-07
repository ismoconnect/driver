# Flux de Fonctionnement de l'Application

Ce document résume la logique métier, le suivi chronologique des dossiers candidats, ainsi que le fonctionnement de la messagerie, des validations de paiement, et de l'interface d'administration.

---

## 1. Sélection de la formule (Parcours cible) & Règles de Transition
Le flux débute lorsque le candidat s'inscrit et choisit une formule cible, ou que l'administrateur lui en attribue une depuis son tableau de bord :
*   **Perception du Risque** (Cible : Phase 3)
*   **Examen Théorique** (Cible : Phase 2)
*   **Examen Pratique** (Cible : Phase 4)
*   **Permis Direct** (Cible : Phase 5)

### Évolution strictly ascendante :
Les changements de formule s'effectuent uniquement vers le haut pour respecter les acquis du candidat :
*   Un candidat sur la formule **Théorique** peut migrer vers la **Perception du Risque**, la formule **Pratique**, ou le **Permis Direct**.
*   Un candidat sur la formule **Perception du Risque** peut migrer vers la formule **Pratique** ou le **Permis Direct** (le retour vers la formule Théorique, déjà acquise, est impossible).
*   Un candidat sur la formule **Pratique** peut uniquement migrer vers le **Permis Direct**.

---

## 2. Le principe des phases antérieures (Les Acquis)
Puisque le candidat commence son parcours à l'étape de sa formule cible, toutes les étapes antérieures sont considérées comme déjà réussies ou dispensées (les acquis). Elles s'affichent automatiquement en **vert** (`✓ Validé` ou `✓ Dispense`) tant sur l'espace client que sur l'administration :
*   Si la formule cible est **Examen Théorique (Phase 2)**, seule la Phase 1 (Affiliation) est acquise d'office.
*   Si la formule cible est **Perception du Risque (Phase 3)**, les Phases 1 et 2 (Théorie) sont vertes d'office.
*   Si la formule cible est **Examen Pratique (Phase 4)** ou **Permis Direct (Phase 5)**, les Phases 1, 2 et 3 sont vertes d'office.

---

## 3. Le flux de facturation, de paiement et de transition

### Action 1 : Lancer la Facturation (Visibilité RIB)
*   L'administrateur active la facture. Cela affiche le devis détaillé et le RIB sur l'espace du client pour qu'il procède au virement.
*   **Bouton « Changer de formule » :** Ce bouton est **masqué** durant la phase de transmission de l'acompte (`paymentValidated === false`) et durant l'homologation/constitution du dossier (`soldeValidated === false`) pour éviter tout conflit de facturation. Il réapparaît uniquement lorsque le solde est validé (`soldeValidated === true`).
*   **Transition Instantanée :** Lors de la validation d'une mise à niveau, le modal se ferme immédiatement (`setShowUpgradeConfirm(false)`) et l'affichage bascule directement sur l'onglet `wizard` (`setActiveTab('wizard')`), démarrant instantanément la barre de progression de 20 secondes.

### Action 2 : Validation de l'Acompte (200,00 €)
*   Dès réception du virement d'acompte, l'administrateur clique sur **`✓ Valider le virement (200,00 €)`**.
*   *Effets* : 
    - Le statut du dossier passe de `new` à `processing`.
    - Un message automatique est envoyé dans le chat du candidat pour confirmer la réception de l'acompte.
    - Le bouton d'initiation du solde (Action 3) est débloqué.
    - **Acompte (Payé) :** La zone du RIB sur l'espace client met à jour l'acompte comme `✓ Payé` en vert et surligne le solde restant dû en orange (`Solde à régler : X,XX €`).

### Action 3 : Gestion du Solde (Prestations scindées)
*   **Étape 3.1 : Initier le paiement** : Lorsque le document officiel est prêt, l'administrateur clique sur **`⚡ Initier le paiement`**. Cela notifie le candidat sur son espace et lui envoie un message automatique dans le chat lui demandant le solde restant (350,00 €, 550,00 € ou 1900,00 €).
*   **Étape 3.2 : Valider le solde** : Dès réception du second virement, l'administrateur clique sur **`✓ Valider le solde`**.
    - *Effets* : La phase active passe au statut **Vert**, le document officiel est mis à disposition du candidat en téléchargement et le chat confirme la bonne réception du paiement.

---

## 4. Textes de Statuts Dynamiques (Espace Candidat)
Les messages s'adaptent de manière fluide et précise selon la formule active :
*   **Théorique :** Fait référence au *« certificat de l'examen théorique »*.
*   **Perception du Risque :** Fait référence à l'*« attestation de certificat de perception du risque »*.
*   **Pratique :** Fait référence au *« certificat d'examen pratique »*.
*   **Permis Direct :** Fait référence au *« permis de conduire officiel »*.

---

## 5. Console d'Administration (Layout & Règles)

### En-têtes et Affichage des Demandes (`AdminDemandes.jsx`)
*   Les colonnes **Service** et **Statut** sont masquées pour épurer l'interface de la liste principale.
*   L'en-tête et les cellules de la colonne **Contact** sont centrés afin d'équilibrer l'espace visuel suite au masquage des deux colonnes.

### Suivi et Évolution du Dossier (`AdminLeadDetail.jsx`)
*   Les indicateurs de progression (**Nouveau**, **En Cours**, **Terminé**) sous « Évolution du dossier » sont configurés en **lecture seule dynamique** (éléments `div` non cliquables) afin de suivre fidèlement la progression du dossier stockée en base de données tout en évitant les actions accidentelles de changement d'état.

---

## 6. La Réinitialisation (Reset)
En cas de dossier erroné, l'administrateur dispose du bouton **`Réinitialiser`** :
*   Remet à zéro l'ensemble des statuts Firestore du candidat (`status: 'new'`, formule choisie effacée, RIB désactivé, flags financiers remis à `false`).
*   **Supprime définitivement tout l'historique des messages** du chat (dans la sous-collection Firestore `chats/{uid}/messages`) et réinitialise les compteurs de messages non lus pour repartir sur une base propre.
