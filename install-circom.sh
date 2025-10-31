#!/bin/bash

# Script d'installation de Circom pour DEMOCRATIX
# À exécuter dans WSL Ubuntu

set -e  # Arrêter en cas d'erreur

echo "======================================"
echo "  Installation Circom pour DEMOCRATIX"
echo "======================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Étape 1: Vérifier si Rust est installé
echo "Étape 1/5: Vérification de Rust..."
if command -v rustc &> /dev/null; then
    info "Rust est déjà installé (version: $(rustc --version))"
else
    warning "Rust n'est pas installé. Installation en cours..."

    # Installer Rust
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

    # Charger l'environnement Rust
    source "$HOME/.cargo/env"

    info "Rust installé avec succès !"
fi

echo ""

# Étape 2: Installer les dépendances système
echo "Étape 2/5: Installation des dépendances système..."
sudo apt-get update -qq
sudo apt-get install -y -qq build-essential pkg-config libssl-dev git

info "Dépendances système installées"
echo ""

# Étape 3: Vérifier si Circom est déjà installé
echo "Étape 3/5: Vérification de Circom..."
if command -v circom &> /dev/null; then
    info "Circom est déjà installé (version: $(circom --version))"
    read -p "Voulez-vous réinstaller ? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Installation de Circom ignorée"
        echo ""
        echo "======================================"
        echo "  ✅ Installation terminée !"
        echo "======================================"
        echo ""
        echo "Circom est déjà installé et prêt à l'emploi."
        echo ""
        echo "Prochaines étapes:"
        echo "  1. cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/backend/circuits"
        echo "  2. bash compile-all.sh"
        exit 0
    fi

    # Supprimer l'ancienne installation
    rm -rf "$HOME/circom"
fi

# Étape 4: Cloner et compiler Circom
echo "Étape 4/5: Clonage et compilation de Circom..."
cd "$HOME"

if [ -d "circom" ]; then
    warning "Le dossier circom existe déjà. Suppression..."
    rm -rf circom
fi

info "Clonage du dépôt Circom..."
git clone --quiet https://github.com/iden3/circom.git
cd circom

info "Compilation de Circom (cela peut prendre 2-3 minutes)..."
cargo build --release --quiet

info "Installation de Circom..."
cargo install --path circom --quiet

echo ""

# Étape 5: Vérification
echo "Étape 5/5: Vérification de l'installation..."

# Recharger l'environnement
source "$HOME/.cargo/env"

if command -v circom &> /dev/null; then
    info "Circom installé avec succès !"
    echo ""
    echo "Version installée:"
    circom --version
else
    error "Erreur: Circom n'a pas pu être installé"
    exit 1
fi

echo ""
echo "======================================"
echo "  ✅ Installation terminée !"
echo "======================================"
echo ""
echo "Circom est maintenant installé et prêt à l'emploi."
echo ""
echo "Prochaines étapes:"
echo "  1. cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/backend/circuits"
echo "  2. bash compile-all.sh"
echo "  3. bash download-ptau.sh"
echo "  4. bash setup-all.sh"
echo "  5. bash test-circuits.sh"
echo ""

# Nettoyer
cd "$HOME"
rm -rf circom

info "Installation terminée avec succès !"
