import db from './firebase.js';

export default async function handler(req, res) {
  try {
    const docRef = db.collection('done-doodles').doc('done-doodles');
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(200).json({ crossed_out: [] });
    }

    const data = doc.data();
    const raw = data?.pokedex_num;

    let crossedOut = [];

    // Normalize Firestore data into a real array
    if (Array.isArray(raw)) {
      crossedOut = raw;
    } else if (raw && typeof raw === 'object') {
      crossedOut = Object.values(raw);
    }

    // Ensure numeric + clean + sorted
    crossedOut = crossedOut
      .filter(n => typeof n === 'number' && !isNaN(n))
      .sort((a, b) => a - b);

    return res.status(200).json({
      crossed_out: crossedOut,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}