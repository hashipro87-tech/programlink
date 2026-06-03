// mealScanController.js — OCR scan of a meal slip image
// Uses tesseract.js to extract numbers from the image

exports.scanMealSlip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    // Attempt OCR with tesseract
    let extractedCount = null;
    try {
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
      const numbers = text.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        extractedCount = parseInt(numbers[0], 10);
      }
    } catch (ocrErr) {
      console.warn('OCR failed, returning null count:', ocrErr.message);
    }

    res.json({
      extracted_count: extractedCount,
      message: extractedCount !== null
        ? `Detected count: ${extractedCount}. Please verify before submitting.`
        : 'Could not extract count automatically. Please enter manually.',
    });
  } catch (err) {
    console.error('scanMealSlip error:', err);
    res.status(500).json({ error: 'Scan failed. Please enter the count manually.' });
  }
};
