# Flux de Fonctionnement de l'Application

Ce document résume la logique métier, le suivi chronologique des dossiers candidats, ainsi que le fonctionnement de la messagerie et des validations de paiement.

---

## 1. Sélection de la formule (Parcours cible)
Le flux débute lorsque le candidat s'inscrit et choisit une formule cible, ou que l'administrateur lui en attribue une depuis son tableau de bord :
*   **Perception du Risque** (Cible : Phase 3)
*   **Examen Théorique** (Cible : Phase 2)
*   **Examen Pratique** (Cible : Phase 4)
*   **Permis Direct** (Cible : Phase 5)

---

## 2. Le principe des phases antérieures (Les Acquis)
Puisque le candidat commence son parcours à l'étape de sa formule cible, toutes les étapes antérieures sont considérées comme déjà réussies ou dispensées (les acquis). Elles s'affichent automatiquement en **vert** (`✓ Validé` ou `✓ Dispense`) tant sur l'espace client que sur l'administration :
*   Si la formule cible est **Examen Théorique (Phase 2)**, seule la Phase 1 (Affiliation) est acquise d'office.
*   Si la formule cible est **Perception du Risque (Phase 3)**, les Phases 1 et 2 (Théorie) sont vertes d'office.
*   Si la formule cible est **Examen Pratique (Phase 4)** ou **Permis Direct (Phase 5)**, les Phases 1, 2 et 3 sont vertes d'office.

---

## 3. Le flux de facturation et de paiement
Pour la phase active en cours, la gestion financière se fait étape par étape dans l'administration :

### Action 1 : Lancer la Facturation (Visibilité RIB)
*   L'administrateur active la facture. Cela affiche le devis détaillé et le RIB sur l'espace du client pour qu'il procède au virement.

### Action 2 : Validation de l'Acompte (200,00 €)
*   Dès réception du virement d'acompte, l'administrateur clique sur **`✓ Valider le virement (200,00 €)`**.
*   *Effets* : 
    - Le statut du dossier passe de `new` à `processing`.
    - Un message automatique est envoyé dans le chat du candidat pour confirmer la réception de l'acompte.
    - Le bouton d'initiation du solde (Action 3) est débloqué.
    - *Note* : Si l'acompte est annulé ultérieurement, toutes les étapes suivantes (initiation et solde) sont automatiquement réinitialisées à `false`.

### Action 3 : Gestion du Solde (Prestations scindées)
*   **Étape 3.1 : Initier le paiement** : Lorsque le document (Attestation de perception ou Certificat d'examen théorique) est prêt, l'administrateur clique sur **`⚡ Initier le paiement`**. Cela notifie le candidat sur son espace et lui envoie un message automatique dans le chat lui demandant le solde restant (350,00 € ou 550,00 €).
*   **Étape 3.2 : Valider le solde** : Dès réception du second virement, l'administrateur clique sur **`✓ Valider le solde`**.
    - *Effets* : La phase active passe au statut **Vert** (`✓ Dispense` ou `✓ Validé`), le document officiel est mis à disposition du candidat en téléchargement et le chat confirme la bonne réception du paiement.
    - *Note* : La validation du solde change temporairement le statut de la base à `completed`, permettant de préparer la clôture finale.

---

## 4. Action Finale : Clôture du dossier (Clôturer & Valider)
*   Une fois tous les règlements validés et les documents mis à disposition, l'administrateur clique sur **`✓ Terminer`** pour clôturer la phase en cours.
*   **⚠️ IMPORTANT** : La clôture de la phase en cours (ex. Examen Théorique ou Perception du Risque) marque cette phase spécifique comme terminée et enregistrée. **Elle ne débloque pas d'office et ne facture pas le Permis Définitif en Commune (Phase 5)**.
*   Pour obtenir le permis en commune, le candidat doit en faire la demande de façon explicite depuis son profil (ce qui lancera une nouvelle demande et un nouveau cycle de paiement spécifique). Sinon, la Phase 5 reste à l'état `🔒 Non inclus`.

---

## 5. La Réinitialisation (Reset)
En cas de dossier erroné, l'administrateur dispose du bouton **`Réinitialiser`** :
*   Remet à zéro l'ensemble des statuts Firestore du candidat (`status: 'new'`, formule choisie effacée, RIB désactivé, flags financiers remis à `false`).
*   **Supprime définitivement tout l'historique des messages** du chat (dans la sous-collection Firestore `chats/{uid}/messages`) et réinitialise les compteurs de messages non lus pour repartir sur une base propre.
