// formsController.js — Form pre-fill engine: list templates, get field data, generate PDF
'use strict';

const { generateFormData, FORM_TEMPLATES } = require('../services/formDataService');

// GET /forms/templates — list available templates (no org-specific data yet)
async function listTemplates(req, res) {
  const templates = Object.entries(FORM_TEMPLATES).map(([id, t]) => ({
    id,
    label:       t.label,
    description: t.description,
    roles:       t.roles,
  }));
  res.json({ templates });
}

// GET /forms/data/:orgId?template=xxx — return resolved field values (preview)
async function getFormData(req, res) {
  const { orgId } = req.params;
  const { template: templateId } = req.query;

  if (!templateId) return res.status(400).json({ error: 'template query param required' });

  // Sponsors can access any org they own; kitchens/sites only their own
  const role = req.user.role;
  const orgIdToUse = orgId || req.user.organizationId;

  if (role !== 'sponsor' && role !== 'admin' && req.user.organizationId !== orgIdToUse) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const sponsorId = role === 'sponsor' ? req.user.organizationId : null;
    const data = await generateFormData(orgIdToUse, templateId, sponsorId);
    res.json(data);
  } catch (err) {
    if (err.message.startsWith('Unknown template')) return res.status(400).json({ error: err.message });
    if (err.message === 'Organization not found') return res.status(404).json({ error: err.message });
    console.error('formsController.getFormData:', err);
    res.status(500).json({ error: 'Failed to generate form data' });
  }
}

// GET /forms/pdf/:orgId?template=xxx — generate and return PDF
async function generateFormPDF(req, res) {
  const { orgId } = req.params;
  const { template: templateId } = req.query;

  if (!templateId) return res.status(400).json({ error: 'template query param required' });

  const role = req.user.role;
  const orgIdToUse = orgId || req.user.organizationId;

  if (role !== 'sponsor' && role !== 'admin' && req.user.organizationId !== orgIdToUse) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const sponsorId = role === 'sponsor' ? req.user.organizationId : null;
    const formData  = await generateFormData(orgIdToUse, templateId, sponsorId);

    // Build PDF with pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    const filename = `${formData.org.name.replace(/[^a-z0-9]/gi, '_')}_${templateId}_${new Date().getFullYear()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const BRAND   = '#4f46e5';  // brand-600
    const GRAY    = '#6b7280';
    const LGRAY   = '#f3f4f6';
    const BLACK   = '#111827';
    const W       = 612 - 100;  // page width minus margins

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.rect(50, 50, W, 48).fill(BRAND);
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
       .text('CACFPLink', 62, 62);
    doc.fontSize(9).font('Helvetica')
       .text('cacfplink.com', 62, 82);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
       .text(formData.label, 200, 66, { width: W - 155, align: 'right' });

    // ── Sub-header ────────────────────────────────────────────────────────────
    doc.rect(50, 98, W, 22).fill(LGRAY);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text(`Organization: ${formData.org.name}   |   Generated: ${new Date().toLocaleDateString('en-US')}   |   Program Year: ${new Date().getFullYear()}`,
         58, 104, { width: W - 16 });

    let y = 132;

    // Note (if any)
    if (formData.note) {
      doc.rect(50, y, W, 26).fill('#fef3c7');
      doc.fillColor('#92400e').fontSize(8).font('Helvetica-Oblique')
         .text(`ℹ  ${formData.note}`, 58, y + 8, { width: W - 16 });
      y += 36;
    }

    // ── Sections ──────────────────────────────────────────────────────────────
    for (const section of formData.sections) {
      if (y > 680) { doc.addPage(); y = 50; }

      // Section header
      doc.rect(50, y, W, 20).fill(BRAND);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text(section.title.toUpperCase(), 58, y + 5, { width: W - 16 });
      y += 26;

      // Fields — two columns
      const fields = section.fields;
      const COL    = (W - 12) / 2;
      for (let i = 0; i < fields.length; i += 2) {
        if (y > 700) { doc.addPage(); y = 50; }

        const left  = fields[i];
        const right = fields[i + 1];
        const rowH  = 32;

        // Left
        doc.fillColor(GRAY).fontSize(7).font('Helvetica')
           .text(left.label.toUpperCase(), 50, y + 2, { width: COL });
        doc.rect(50, y + 13, COL, 16).fill(LGRAY);
        doc.fillColor(BLACK).fontSize(9).font('Helvetica')
           .text(left.value || '___________________________', 54, y + 16, { width: COL - 8 });

        // Right
        if (right) {
          const rx = 50 + COL + 12;
          doc.fillColor(GRAY).fontSize(7).font('Helvetica')
             .text(right.label.toUpperCase(), rx, y + 2, { width: COL });
          doc.rect(rx, y + 13, COL, 16).fill(LGRAY);
          doc.fillColor(BLACK).fontSize(9).font('Helvetica')
             .text(right.value || '___________________________', rx + 4, y + 16, { width: COL - 8 });
        }

        y += rowH + 4;
      }
      y += 12;
    }

    // ── Checklist ─────────────────────────────────────────────────────────────
    if (formData.checklist?.length) {
      if (y > 620) { doc.addPage(); y = 50; }
      doc.rect(50, y, W, 20).fill(BRAND);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text('RENEWAL CONFIRMATION', 58, y + 5);
      y += 26;
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text('By signing below, the authorized representative confirms the following:', 50, y);
      y += 16;
      for (const item of formData.checklist) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.rect(50, y, 12, 12).stroke('#d1d5db');
        doc.fillColor(BLACK).fontSize(9).font('Helvetica')
           .text(item, 70, y + 1, { width: W - 20 });
        y += 20;
      }
      y += 8;
    }

    // ── Signature lines ────────────────────────────────────────────────────────
    if (formData.signature_line) {
      if (y > 660) { doc.addPage(); y = 50; }
      y += 10;
      doc.rect(50, y, W, 20).fill(BRAND);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text('SIGNATURES', 58, y + 5);
      y += 28;

      const sigCols = formData.signature_line_2 ? 2 : 1;
      const sigW    = sigCols === 2 ? (W - 20) / 2 : W;

      const drawSig = (label, x, sw) => {
        doc.moveTo(x, y + 30).lineTo(x + sw, y + 30).stroke('#9ca3af');
        doc.fillColor(BLACK).fontSize(9).font('Helvetica')
           .text(label, x, y + 33, { width: sw });
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
           .text('Signature', x, y + 2, { width: sw / 2 });
        const dateX = x + sw / 2 + 10;
        doc.moveTo(dateX, y + 30).lineTo(x + sw, y + 30).stroke('#9ca3af');
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
           .text('Date', dateX, y + 2);
        doc.fillColor(BLACK).fontSize(8).font('Helvetica')
           .text('Print Name:', x, y + 48, { continued: true })
           .text(' ____________________________________________', { width: sw - 60 });
        doc.fillColor(BLACK).fontSize(8).font('Helvetica')
           .text('Title:', x, y + 62, { continued: true })
           .text(' ________________________________________________', { width: sw - 40 });
      };

      drawSig(formData.signature_label, 50, sigW);
      if (formData.signature_line_2) {
        drawSig(formData.signature_label_2, 50 + sigW + 20, sigW);
      }
      y += 80;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange?.().count ?? 1;
    doc.rect(50, 742, W, 1).fill('#e5e7eb');
    doc.fillColor(GRAY).fontSize(7).font('Helvetica')
       .text('This form was generated by CACFPLink — cacfplink.com', 50, 747, { width: W / 2 })
       .text(`Generated ${new Date().toLocaleDateString('en-US')} · Page 1 of ${pageCount}`, 50, 747, { width: W, align: 'right' });

    doc.end();
  } catch (err) {
    if (err.message.startsWith('Unknown template')) return res.status(400).json({ error: err.message });
    if (err.message === 'Organization not found') return res.status(404).json({ error: err.message });
    console.error('formsController.generateFormPDF:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

module.exports = { listTemplates, getFormData, generateFormPDF };
