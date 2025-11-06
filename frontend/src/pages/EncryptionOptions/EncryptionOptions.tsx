/**
 * Page d'explication des options de chiffrement pour les votes privés
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const EncryptionOptions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-4"
          >
            <span>←</span> Retour
          </button>
          <h1 className="text-4xl font-bold text-primary mb-4">
            🔐 Options de Chiffrement pour Votes Privés
          </h1>
          <p className="text-lg text-secondary">
            DEMOCRATIX propose deux options pour garantir l'anonymat des votes tout en permettant le comptage des résultats.
          </p>
        </div>

        {/* Tableau comparatif */}
        <div className="mb-12 bg-secondary rounded-xl p-6 border-2 border-accent">
          <h2 className="text-2xl font-bold text-primary mb-6">
            📊 Comparaison des Options
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-accent">
                  <th className="text-left py-3 px-4 text-primary font-semibold">Critère</th>
                  <th className="text-center py-3 px-4 text-primary font-semibold">Option 1<br/>(ElGamal seul)</th>
                  <th className="text-center py-3 px-4 text-primary font-semibold">Option 2<br/>(zk-SNARK + ElGamal)</th>
                </tr>
              </thead>
              <tbody className="text-primary">
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Coût par vote</td>
                  <td className="text-center py-3 px-4 text-success font-semibold">~0.002 EGLD</td>
                  <td className="text-center py-3 px-4">~0.0042 EGLD</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Temps de vote</td>
                  <td className="text-center py-3 px-4 text-success font-semibold">~1s</td>
                  <td className="text-center py-3 px-4">~2-3s</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Gas réel utilisé</td>
                  <td className="text-center py-3 px-4 text-success font-semibold">~2M</td>
                  <td className="text-center py-3 px-4">~16M</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Anonymat</td>
                  <td className="text-center py-3 px-4">✅ Garanti</td>
                  <td className="text-center py-3 px-4">✅ Garanti</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Protection double vote</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">✅ Nullifier</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Comptage des résultats</td>
                  <td className="text-center py-3 px-4">✅ Après déchiffrement</td>
                  <td className="text-center py-3 px-4">✅ Après déchiffrement</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Sécurité</td>
                  <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-semibold">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr className="border-b border-secondary">
                  <td className="py-3 px-4">Complexité</td>
                  <td className="text-center py-3 px-4 text-success font-semibold">⭐⭐ Simple</td>
                  <td className="text-center py-3 px-4">⭐⭐⭐⭐ Complexe</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Statut</td>
                  <td className="text-center py-3 px-4">
                    <span className="px-2 py-1 bg-success text-white rounded-full text-xs font-medium">
                      DISPONIBLE
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                      DISPONIBLE
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Option 1 : ElGamal */}
        <div className="mb-8 bg-success bg-opacity-10 border-2 border-success rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-primary">
              Option 1 : Chiffrement ElGamal
            </h2>
            <span className="px-3 py-1 bg-success text-white rounded-full text-sm font-medium">
              RECOMMANDÉ
            </span>
          </div>

          <div className="space-y-4 text-primary">
            <p className="text-lg">
              Utilise le <strong>chiffrement ElGamal</strong> sur courbe elliptique pour protéger les votes.
            </p>

            <div>
              <h3 className="font-semibold mb-2">✅ Avantages :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>2× moins cher</strong> que l'Option 2 (~0.002 EGLD vs ~0.0042 EGLD)</li>
                <li><strong>Plus rapide</strong> : vote en ~1s (vs ~2-3s)</li>
                <li><strong>Gas efficace</strong> : ~2M gas utilisé</li>
                <li><strong>Plus simple</strong> à utiliser et à auditer</li>
                <li><strong>Anonymat garanti</strong> : impossible de savoir qui a voté quoi</li>
                <li><strong>Comptage après déchiffrement</strong> par l'organisateur</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📝 Comment ça fonctionne ?</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>L'organisateur génère une paire de clés (publique + privée)</li>
                <li>Les électeurs chiffrent leur vote avec la clé publique</li>
                <li>Les votes chiffrés sont stockés sur la blockchain (illisibles)</li>
                <li>Après la clôture, l'organisateur déchiffre avec sa clé privée</li>
                <li>Les résultats sont publiés (nombre de votes par candidat)</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🎯 Idéal pour :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Élections associatives, d'entreprise, communautaires</li>
                <li>Budget limité (coûts gas réduits)</li>
                <li>Performance importante (vote rapide)</li>
                <li>Organisateur unique de confiance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option 2 : zk-SNARK + ElGamal */}
        <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-600 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-primary">
              Option 2 : zk-SNARK + ElGamal
            </h2>
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
              DISPONIBLE
            </span>
            <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
              SÉCURITÉ MAX
            </span>
          </div>

          <div className="space-y-4 text-primary">
            <p className="text-lg">
              Combine <strong>chiffrement ElGamal + preuves zk-SNARK (Groth16)</strong> pour une sécurité mathématique maximale.
            </p>

            <div>
              <h3 className="font-semibold mb-2">✅ Avantages :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Tous les avantages de l'Option 1 <strong>+</strong></li>
                <li><strong>Preuve mathématique</strong> que le chiffrement est valide (zk-SNARK Groth16)</li>
                <li><strong>Nullifier unique</strong> : protection cryptographique contre le double vote</li>
                <li><strong>Protection renforcée</strong> contre manipulation du chiffrement</li>
                <li><strong>Auditabilité mathématique</strong> : preuves vérifiables par tous</li>
                <li><strong>Certification possible</strong> pour élections critiques</li>
                <li><strong>Anonymat renforcé</strong> : impossible de lier vote et voteur</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📊 Performances réelles :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Coût :</strong> ~0.0042 EGLD par vote (données blockchain réelles)</li>
                <li><strong>Gas utilisé :</strong> ~16M gas (sur 50M alloués)</li>
                <li><strong>Temps génération preuve :</strong> ~1.4s</li>
                <li><strong>Temps total :</strong> ~2-3s (génération + blockchain)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">⚠️ Considérations :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>2× plus cher que l'Option 1 (mais reste très abordable)</li>
                <li>Plus complexe techniquement (génération de preuve cryptographique)</li>
                <li>Nécessite plus de temps (~2s de plus)</li>
                <li>Charge CPU côté client pour générer la preuve</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🎯 Idéal pour :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Élections critiques nécessitant la sécurité maximale</li>
                <li>Élections nationales (présidentielles, législatives, référendums)</li>
                <li>Organisations nécessitant une certification légale</li>
                <li>Cas où le double vote doit être mathématiquement impossible</li>
                <li>Audits externes et vérifications indépendantes</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-600 rounded-lg">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                ✅ Statut : Option 2 est maintenant disponible en production avec Groth16 zk-SNARK !
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8 bg-secondary rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">❓ Questions Fréquentes</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-primary mb-2">
                Q : Les deux options garantissent-elles l'anonymat ?
              </h3>
              <p className="text-sm text-secondary">
                R : Oui ! Les deux options garantissent que personne ne peut savoir QUI a voté pour QUOI.
                La différence est dans le niveau de sécurité mathématique.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-2">
                Q : Peut-on changer d'option après création de l'élection ?
              </h3>
              <p className="text-sm text-secondary">
                R : Non, l'option de chiffrement doit être choisie lors de la création et ne peut pas être modifiée ensuite.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-2">
                Q : Que se passe-t-il si je perds ma clé privée ?
              </h3>
              <p className="text-sm text-secondary">
                R : Si vous perdez votre clé privée, vous ne pourrez plus déchiffrer les votes privés.
                Il est crucial de la conserver en sécurité (recommandé : stockage offline + backup).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-2">
                Q : Puis-je proposer les deux types de votes (standard + privé) ?
              </h3>
              <p className="text-sm text-secondary">
                R : Oui ! Avec l'Option 1 ou 2 activée, les électeurs pourront choisir entre :
                <br/>• Vote Standard (public, gratuit)
                <br/>• Vote Privé Option 1 (anonyme, ~0.002 EGLD)
                <br/>• Vote Privé Option 2 (anonyme + preuve, ~0.0042 EGLD)
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-primary mb-2">
                Q : Quelle est la différence de coût réelle entre les options ?
              </h3>
              <p className="text-sm text-secondary">
                R : Basé sur les données blockchain réelles :
                <br/>• Option 0 (Standard) : Gratuit
                <br/>• Option 1 (ElGamal) : ~0.002 EGLD (~$0.02)
                <br/>• Option 2 (ElGamal + zk-SNARK) : ~0.0042 EGLD (~$0.04)
                <br/>L'Option 2 coûte environ 2× plus cher mais reste très abordable pour la sécurité maximale apportée.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/create-election')}
            className="px-6 py-3 bg-success text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
          >
            Créer une élection avec Option 1
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-secondary text-primary rounded-lg hover:bg-tertiary transition-all font-semibold"
          >
            Retour
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 p-4 bg-primary bg-opacity-5 border border-secondary rounded-lg text-center">
          <p className="text-sm text-secondary">
            📚 Pour plus de détails techniques, consultez la documentation :
          </p>
          <div className="mt-2 flex gap-4 justify-center text-xs">
            <a
              href="https://github.com/yourusername/democratix"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Documentation Option 1
            </a>
            <a
              href="https://github.com/yourusername/democratix"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline"
            >
              Documentation Option 2 (futur)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
