/**
 * Document Intelligence Service
 *
 * Uses Claude to classify uploaded documents and verify they match the
 * selected document type. Returns structured JSON so the backend makes
 * the final accept/reject decision — Claude identifies, CACFPLink decides.
 *
 * Three outcomes:
 *   verified      — document matches selected type (confidence >= 0.80)
 *   needs_review  — document could not be confidently identified (confidence < 0.60)
 *   wrong_document — document is a different type (confidence >= 0.60 but mismatch)
 */

const Anthropic = require('@anthropic-ai/sdk');

// Human-readable descriptions sent to Claude so it understands what each type looks like
const DOC_TYPE_DESCRIPTIONS = {
  w9:          'IRS Form W-9 — Request for Taxpayer Identification Number and Certification. Should contain fields for name, business name, federal tax classification, address, and taxpayer identification number (TIN/EIN/SSN). Issued by the U.S. Internal Revenue Service.',
  food_permit: 'Food Service Permit or Food Establishment Permit. Issued by a state or local health/agriculture department. Should include establishment name, address, permit number, issue date, expiration date, and an authorized inspector or agency signature.',
  insurance:   'Certificate of Liability Insurance. Often follows ACORD 25 format. Should list the insured party, insurance producer, policy types (General Liability, Auto, Workers Comp, etc.), policy numbers, effective/expiration dates, and coverage limits.',
  health_cert: 'Health Inspection Report or Health Inspection Certificate. Issued by a county or municipal health department. Should include the establishment name, inspection date, score or pass/fail result, any violations noted, and inspector name/signature.',
  enrollment:  'CACFP Enrollment Form or Child Enrollment Record. Lists enrolled children with name, date of birth, days/meals attending, parent/guardian signature, and program eligibility information.',
  license:     'Operating License or Child Care License. Issued by a state or local licensing agency. Should include the facility name, license number, capacity, and expiration date.',
  menu_plan:   'CACFP Menu Plan. Shows scheduled meals (Breakfast, Lunch, AM/PM Snack, Supper) for each day of the week, with food items listed by meal component (grain, protein, fruit/vegetable, milk).',
  general:     'A general program document. Could be any document related to program operations.',
};

/**
 * Classify a document against a selected doc_type.
 *
 * @param {Buffer} fileBuffer  — raw file bytes
 * @param {string} mimeType    — 'application/pdf', 'image/jpeg', etc.
 * @param {string} fileName    — original file name (for context)
 * @param {string} docType     — the type the user selected (e.g. 'w9', 'food_permit')
 * @returns {Promise<{
 *   outcome: 'verified'|'needs_review'|'wrong_document',
 *   detected_type: string,
 *   confidence: number,
 *   matches_selected_type: boolean,
 *   reason: string,
 *   user_message: string,
 * }>}
 */
async function classifyDocument(fileBuffer, mimeType, fileName, docType) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // No API key — skip validation, treat as needs_review
    return {
      outcome:              'needs_review',
      detected_type:        'unknown',
      confidence:           0,
      matches_selected_type: false,
      reason:               'Document intelligence not configured (no API key).',
      user_message:         'Document saved. Manual review required.',
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const selectedDescription = DOC_TYPE_DESCRIPTIONS[docType] ?? `A document of type: ${docType}`;
  const allTypes = Object.entries(DOC_TYPE_DESCRIPTIONS)
    .map(([key, desc]) => `- ${key}: ${desc.split('.')[0]}`)
    .join('\n');

  const systemPrompt = `You are a CACFP (Child and Adult Care Food Program) document verification assistant.
Your job is to identify what type of document has been uploaded and determine whether it matches what the user selected.

You must respond with ONLY valid JSON — no markdown, no explanation outside the JSON.

JSON format:
{
  "detected_type": "<one of the known types below, or 'unknown'>",
  "confidence": <0.0 to 1.0>,
  "matches_selected_type": <true or false>,
  "reason": "<one sentence explaining what you detected and why it does or does not match>"
}

Known document types:
${allTypes}

Rules:
- Base your classification on the CONTENT of the document, not the filename.
- If the document is clearly a specific type, confidence should be 0.85-0.99.
- If the document is hard to read or ambiguous, confidence should be 0.40-0.65.
- If the document is clearly a DIFFERENT type from what was selected, matches_selected_type = false.
- If the document cannot be read or is completely unrelated to any known type, use detected_type = "unknown".
- Never assume a document matches based on the filename alone.`;

  const userPrompt = `The user selected document type: "${docType}"
Selected type description: ${selectedDescription}

File name: ${fileName}

Please examine the document content and return your classification as JSON.`;

  try {
    let messageContent;

    if (mimeType === 'application/pdf') {
      // PDF: use claude-3-5-sonnet with PDF beta support
      const response = await client.beta.messages.create({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        betas:      ['pdfs-2024-09-25'],
        system:     systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'document',
              source: {
                type:       'base64',
                media_type: 'application/pdf',
                data:       fileBuffer.toString('base64'),
              },
            },
            { type: 'text', text: userPrompt },
          ],
        }],
      });
      messageContent = response.content[0]?.text ?? '';
    } else if (mimeType.startsWith('image/')) {
      // Image: standard vision
      const imgType = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
      const response = await client.messages.create({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        system:     systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'image',
              source: {
                type:       'base64',
                media_type: imgType,
                data:       fileBuffer.toString('base64'),
              },
            },
            { type: 'text', text: userPrompt },
          ],
        }],
      });
      messageContent = response.content[0]?.text ?? '';
    } else {
      // Non-visual file type (xlsx, docx, etc.) — Claude can't read these natively
      return {
        outcome:              'needs_review',
        detected_type:        'unknown',
        confidence:           0.3,
        matches_selected_type: false,
        reason:               `File type "${mimeType}" cannot be visually inspected. Please upload a PDF or image.`,
        user_message:         'This file type cannot be automatically verified. A reviewer will check it manually.',
      };
    }

    // Parse JSON from Claude's response
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Claude response');
    const parsed = JSON.parse(jsonMatch[0]);

    const confidence           = parseFloat(parsed.confidence) || 0;
    const matchesSelected      = !!parsed.matches_selected_type;
    const detectedType         = parsed.detected_type ?? 'unknown';
    const reason               = parsed.reason ?? '';

    // Decision logic — Claude identifies, CACFPLink decides
    let outcome, userMessage;
    if (confidence >= 0.80 && matchesSelected) {
      outcome     = 'verified';
      userMessage = `Document verified as ${docType.replace(/_/g, ' ')}.`;
    } else if (confidence < 0.60) {
      outcome     = 'needs_review';
      userMessage = 'Document could not be confidently identified. A reviewer will inspect it manually.';
    } else {
      // Confident enough but wrong type
      outcome     = 'wrong_document';
      const detected = DOC_TYPE_DESCRIPTIONS[detectedType]?.split('.')[0] ?? detectedType;
      const expected = DOC_TYPE_DESCRIPTIONS[docType]?.split('.')[0]      ?? docType;
      userMessage = `Wrong document. We detected: ${detected}. You selected: ${expected}. Please upload the correct document.`;
    }

    return { outcome, detected_type: detectedType, confidence, matches_selected_type: matchesSelected, reason, user_message: userMessage };

  } catch (err) {
    console.error('[documentIntelligence] error:', err.message);
    // On any error fall back to needs_review so upload still succeeds
    return {
      outcome:              'needs_review',
      detected_type:        'unknown',
      confidence:           0,
      matches_selected_type: false,
      reason:               `Classification error: ${err.message}`,
      user_message:         'Document saved but could not be automatically verified. Manual review required.',
    };
  }
}

module.exports = { classifyDocument };
