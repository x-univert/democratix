import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface Candidate {
  id: number;
  name: string;
  votes: number;
  percentage: number;
}

interface Election {
  id: number;
  title: string;
  description: string;
  organizer: string;
  status: number;
  start_time: number;
  end_time: number;
  encryption_type: number;
  total_votes?: number;
}

interface PDFExportOptions {
  election: Election;
  candidates: Candidate[];
  includeCharts?: boolean;
  chartElementId?: string;
  includeAuditTrail?: boolean;
  transactionHashes?: string[];
}

/**
 * Service d'export PDF pour les résultats d'élections
 */
export class PDFExportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private yPosition: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Exporter les résultats d'élection en PDF
   */
  async exportElectionResults(options: PDFExportOptions): Promise<void> {
    const { election, candidates, includeCharts, chartElementId, includeAuditTrail, transactionHashes } = options;

    // En-tête avec logo
    this.addHeader(election);

    // Informations élection
    this.addElectionInfo(election);

    // Résultats des candidats
    this.addResultsTable(candidates, election.total_votes || 0);

    // Graphiques (si demandé)
    if (includeCharts && chartElementId) {
      await this.addCharts(chartElementId);
    }

    // Trail d'audit (si demandé)
    if (includeAuditTrail && transactionHashes) {
      this.addAuditTrail(transactionHashes);
    }

    // Pied de page avec signature
    this.addFooter(election);

    // Sauvegarder
    const filename = `DEMOCRATIX_Election_${election.id}_Results_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename);
  }

  /**
   * Ajouter l'en-tête avec logo
   */
  private addHeader(election: Election): void {
    // Logo DEMOCRATIX (texte stylisé pour l'instant)
    this.doc.setFontSize(24);
    this.doc.setTextColor(59, 130, 246); // Bleu
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DEMOCRATIX', this.margin, this.yPosition);

    // Ligne de séparation
    this.yPosition += 8;
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);

    this.yPosition += 10;

    // Titre du rapport
    this.doc.setFontSize(18);
    this.doc.setTextColor(31, 41, 55); // Gris foncé
    this.doc.text('Rapport de Résultats d\'Élection', this.margin, this.yPosition);

    this.yPosition += 15;
  }

  /**
   * Ajouter les informations de l'élection
   */
  private addElectionInfo(election: Election): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('Informations de l\'Élection', this.margin, this.yPosition);

    this.yPosition += 8;

    // Tableau d'informations
    const info = [
      ['ID de l\'élection', `#${election.id}`],
      ['Titre', election.title],
      ['Organisateur', election.organizer],
      ['Type de chiffrement', this.getEncryptionTypeName(election.encryption_type)],
      ['Statut', this.getStatusName(election.status)],
      ['Date de début', new Date(election.start_time * 1000).toLocaleString('fr-FR')],
      ['Date de fin', new Date(election.end_time * 1000).toLocaleString('fr-FR')],
      ['Total de votes', (election.total_votes || 0).toString()],
    ];

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [],
      body: info,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 'auto', fontSize: 8 }
      },
      margin: { left: this.margin },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Ajouter le tableau des résultats
   */
  private addResultsTable(candidates: Candidate[], totalVotes: number): void {
    // Vérifier si on a besoin d'une nouvelle page
    if (this.yPosition > this.pageHeight - 80) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('Résultats par Candidat', this.margin, this.yPosition);

    this.yPosition += 8;

    // Préparer les données
    const tableData = candidates.map((candidate, index) => [
      (index + 1).toString(),
      candidate.name,
      candidate.votes.toString(),
      `${candidate.percentage.toFixed(2)}%`,
      this.getProgressBar(candidate.percentage)
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Rang', 'Candidat', 'Votes', 'Pourcentage', 'Visualisation']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // Bleu
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 60 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'left', cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Ajouter les graphiques (capture d'écran)
   */
  private async addCharts(chartElementId: string): Promise<void> {
    const chartElement = document.getElementById(chartElementId);
    if (!chartElement) {
      console.warn('Chart element not found:', chartElementId);
      return;
    }

    // Vérifier si on a besoin d'une nouvelle page
    if (this.yPosition > this.pageHeight - 120) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Visualisation Graphique', this.margin, this.yPosition);
    this.yPosition += 10;

    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - (2 * this.margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Vérifier si l'image rentre sur la page
      if (this.yPosition + imgHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.yPosition = this.margin;
      }

      this.doc.addImage(imgData, 'PNG', this.margin, this.yPosition, imgWidth, imgHeight);
      this.yPosition += imgHeight + 15;
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }

  /**
   * Ajouter le trail d'audit
   */
  private addAuditTrail(transactionHashes: string[]): void {
    // Nouvelle page pour l'audit
    this.doc.addPage();
    this.yPosition = this.margin;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('Trail d\'Audit Blockchain', this.margin, this.yPosition);

    this.yPosition += 10;

    const auditData = transactionHashes.map((hash, index) => [
      (index + 1).toString(),
      this.truncateHash(hash),
      new Date().toLocaleString('fr-FR'),
      'Confirmé ✓'
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['#', 'Hash de Transaction', 'Date/Heure', 'Statut']],
      body: auditData,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Vert
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 'auto', font: 'courier', fontSize: 6 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 20 }
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;

    // Note de vérification
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(107, 114, 128);
    const verifyText = 'Pour vérifier ces transactions, visitez: https://devnet-explorer.multiversx.com/';
    this.doc.text(verifyText, this.margin, this.yPosition);
  }

  /**
   * Ajouter le pied de page avec signature
   */
  private addFooter(election: Election): void {
    // Aller à la dernière page
    const totalPages = this.doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);

      // Ligne de séparation
      const footerY = this.pageHeight - 25;
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

      // Texte de signature
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128);

      const signatureText = `Généré par DEMOCRATIX | Date: ${new Date().toLocaleString('fr-FR')} | Page ${i}/${totalPages}`;
      this.doc.text(signatureText, this.pageWidth / 2, footerY + 5, { align: 'center' });

      // QR Code de vérification (placeholder)
      this.doc.setFontSize(7);
      const verifyText = `ID Élection: #${election.id} | Blockchain: MultiversX Devnet`;
      this.doc.text(verifyText, this.pageWidth / 2, footerY + 10, { align: 'center' });
    }
  }

  /**
   * Utilitaires
   */
  private getEncryptionTypeName(type: number): string {
    switch (type) {
      case 0: return 'Standard (Public)';
      case 1: return 'ElGamal (Chiffré)';
      case 2: return 'ElGamal + zk-SNARK (Sécurité Maximale)';
      default: return `Type ${type}`;
    }
  }

  private getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Créée';
      case 1: return 'Active';
      case 2: return 'Clôturée';
      case 3: return 'Finalisée';
      default: return `Statut ${status}`;
    }
  }

  private truncateAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  }

  private truncateHash(hash: string): string {
    // Ne plus tronquer les hash - afficher en entier
    return hash;
  }

  private getProgressBar(percentage: number): string {
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    return '█'.repeat(filled) + '░'.repeat(barLength - filled);
  }
}

/**
 * Fonction helper pour exporter rapidement
 */
export const exportResultsToPDF = async (options: PDFExportOptions): Promise<void> => {
  const service = new PDFExportService();
  await service.exportElectionResults(options);
};

/**
 * ============================================
 * EXPORT DASHBOARD ANALYTICS
 * ============================================
 */

interface DashboardElection {
  id: number;
  title: string;
  status: string;
  start_time: number;
  end_time: number;
  total_votes: number;
  num_candidates: number;
  registered_voters_count: number;
  requires_registration: boolean;
  organizer: string;
}

interface DashboardStats {
  total: number;
  pending: number;
  active: number;
  closed: number;
  finalized: number;
  totalVotes: number;
  totalCandidates: number;
}

interface DashboardPDFOptions {
  globalStats: DashboardStats;
  myStats: DashboardStats;
  myElections: DashboardElection[];
  organizerAddress: string;
}

/**
 * Exporter le dashboard analytics complet en PDF
 */
export const exportDashboardToPDF = async (options: DashboardPDFOptions): Promise<void> => {
  const { globalStats, myStats, myElections, organizerAddress } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const primaryColor = [30, 64, 175]; // #1E40AF
  const accentColor = [59, 130, 246]; // #3B82F6

  // ============================================
  // EN-TÊTE
  // ============================================

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMOCRATIX', margin, 22);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Dashboard Analytics - Rapport Complet', margin, 34);

  // Date
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.text(dateStr, pageWidth - margin, 28, { align: 'right' });

  yPos = 58;

  // ============================================
  // INFO ORGANISATEUR
  // ============================================

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Organisateur: ${organizerAddress.substring(0, 25)}...`, margin, yPos);
  yPos += 12;

  // ============================================
  // STATISTIQUES GLOBALES
  // ============================================

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('I. Statistiques Globales de la Plateforme', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Total d\'élections', globalStats.total.toString()],
      ['Élections en attente', globalStats.pending.toString()],
      ['Élections actives', globalStats.active.toString()],
      ['Élections fermées', globalStats.closed.toString()],
      ['Élections finalisées', globalStats.finalized.toString()],
      ['Total de votes enregistrés', globalStats.totalVotes.toString()],
      ['Total de candidats', globalStats.totalCandidates.toString()]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246]
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 18;

  // ============================================
  // MES ÉLECTIONS - STATS
  // ============================================

  if (myElections.length > 0) {
    // Vérifier nouvelle page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('II. Mes Elections Organisees', margin, yPos);
    yPos += 10;

    // Calculer taux de participation moyen
    const electionsWithReg = myElections.filter(
      e => e.requires_registration && e.registered_voters_count > 0
    );
    let avgParticipation = 'N/A';
    if (electionsWithReg.length > 0) {
      const totalPart = electionsWithReg.reduce(
        (sum, e) => sum + (e.total_votes / e.registered_voters_count),
        0
      );
      avgParticipation = `${Math.round((totalPart / electionsWithReg.length) * 100)}%`;
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Métrique', 'Valeur']],
      body: [
        ['Total d\'élections organisées', myStats.total.toString()],
        ['Élections actives', myStats.active.toString()],
        ['Élections fermées', myStats.closed.toString()],
        ['Élections finalisées', myStats.finalized.toString()],
        ['Total de votes reçus', myStats.totalVotes.toString()],
        ['Taux de participation moyen', avgParticipation]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 18;

    // ============================================
    // LISTE DÉTAILLÉE DES ÉLECTIONS
    // ============================================

    // Nouvelle page pour la liste
    doc.addPage();
    yPos = margin;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Liste Détaillée de Mes Élections', margin, yPos);
    yPos += 10;

    const electionsData = myElections.map(election => {
      const statusMap: { [key: string]: string } = {
        'Pending': 'Attente',
        'Active': 'Active',
        'Closed': 'Fermée',
        'Finalized': 'Finalisée'
      };

      const participation = election.requires_registration && election.registered_voters_count > 0
        ? `${Math.round((election.total_votes / election.registered_voters_count) * 100)}%`
        : '-';

      return [
        election.id.toString(),
        election.title.length > 35 ? election.title.substring(0, 35) + '...' : election.title,
        statusMap[election.status] || election.status,
        election.total_votes.toString(),
        election.num_candidates.toString(),
        election.registered_voters_count.toString(),
        participation
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Titre', 'Statut', 'Votes', 'Candidats', 'Inscrits', 'Part.']],
      body: electionsData,
      theme: 'striped',
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 65, halign: 'left' },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 16 }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ============================================
    // INSIGHTS & RECOMMANDATIONS
    // ============================================

    // Vérifier nouvelle page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('III. Insights & Recommandations', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);

    const insights: string[] = [];

    // Génération d'insights
    if (myStats.active > 0) {
      insights.push(`- Vous avez ${myStats.active} election(s) active(s) en cours`);
    }
    if (myStats.totalVotes > 100) {
      insights.push(`- Excellente participation : ${myStats.totalVotes} votes au total`);
    }
    if (electionsWithReg.length > 0 && avgParticipation !== 'N/A') {
      insights.push(`- Taux de participation moyen: ${avgParticipation}`);
    }
    if (myStats.pending > 0) {
      insights.push(`! ${myStats.pending} election(s) en attente d'activation`);
    }
    if (myStats.closed > 0 && myStats.finalized === 0) {
      insights.push(`! ${myStats.closed} election(s) fermee(s) a finaliser`);
    }

    if (insights.length === 0) {
      insights.push('- Creez votre premiere election pour voir des insights personnalises');
    }

    insights.forEach(insight => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(insight, margin + 5, yPos);
      yPos += 7;
    });
  } else {
    // Pas d'élections
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Aucune élection organisée pour le moment.', margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Créez votre première élection pour commencer à utiliser DEMOCRATIX !', margin, yPos);
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Ligne
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    // Texte
    doc.text(
      'DEMOCRATIX - Vote Décentralisé sur Blockchain MultiversX',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );

    // Page number
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // ============================================
  // TÉLÉCHARGER
  // ============================================

  const filename = `DEMOCRATIX_Dashboard_Analytics_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
