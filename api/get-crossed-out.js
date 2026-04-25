import db from './firebase.js';

console.log("PROJECT:", process.env.FIREBASE_PROJECT_ID);
console.log("EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("KEY EXISTS:", !!process.env.FIREBASE_PRIVATE_KEY);

export default async function handler(req, res) {
  try {
    const docRef = db.collection('done-doodles').doc('done-doodles');
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(200).json({ crossed_out: [] });
    }

    const data = doc.data();
    return res.status(200).json({
      crossed_out: data.pokedex_num || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}