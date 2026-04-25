import db from './firebase.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { number } = req.body;

    if (
      typeof number !== 'number' ||
      number < 1 ||
      number > 1028
    ) {
      return res.status(400).json({ error: 'Invalid number' });
    }

    const docRef = db.collection('done-doodles').doc('done-doodles');
    const doc = await docRef.get();

    let numbers = [];

    if (doc.exists) {
      numbers = doc.data().pokedex_num || [];
    }

    if (!numbers.includes(number)) {
      numbers.push(number);
      numbers.sort((a, b) => a - b);
    }

    await docRef.set({
      pokedex_num: numbers,
    });

    return res.status(200).json({
      success: true,
      data: numbers,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}