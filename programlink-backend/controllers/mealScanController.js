// mealScanController.js — AI scan of a meal slip image
// Uses Claude vision (claude-haiku) to extract per-meal-type counts

exports.scanMealSlip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Scan service not configured.' });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    // Detect media type
    const mime = req.file.mimetype || 'image/jpeg';
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(mime)) {
      return res.status(400).json({ error: 'Unsupported image type. Use JPG, PNG, or WebP.' });
    }

    const base64 = req.file.buffer.toString('base64');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mime, data: base64 },
          },
          {
            type: 'text',
            text: `This is a CACFP meal count slip or tally sheet. Extract the meal counts for each meal type.

Return ONLY valid JSON in this exact format (use 0 if a meal type is not found):
{"breakfast": 0, "lunch": 0, "snack": 0, "supper": 0}

Look for labels like Breakfast/AM, Lunch/Dinner, Snack/PM Snack, Supper/Evening. Use the largest or most prominent number next to each label.`,
          },
        ],
      }],
    });

    const text = message.content[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return res.json({ breakfast: 0, lunch: 0, snack: 0, supper: 0, message: 'Could not read counts — enter manually.' });
    }

    const counts = JSON.parse(jsonMatch[0]);
    const breakfast = parseInt(counts.breakfast) || 0;
    const lunch     = parseInt(counts.lunch)     || 0;
    const snack     = parseInt(counts.snack)     || 0;
    const supper    = parseInt(counts.supper)    || 0;

    res.json({
      breakfast, lunch, snack, supper,
      total: breakfast + lunch + snack + supper,
      message: 'Counts filled in from scan — review before saving.',
    });
  } catch (err) {
    console.error('scanMealSlip error:', err.message);
    res.json({ breakfast: 0, lunch: 0, snack: 0, supper: 0, message: 'Scan failed — enter counts manually.' });
  }
};
