const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/add-crossed-out', (req, res) => {
    const { number } = req.body;
    
    if (typeof number !== 'number' || number < 1 || number > 1028) {
        return res.status(400).json({ error: 'Invalid number' });
    }
    
    const filePath = path.join(__dirname, 'crossed_out.json');
    
    try {
        let data = { crossed_out: [] };
        
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        }
        
        if (!data.crossed_out.includes(number)) {
            data.crossed_out.push(number);
            data.crossed_out.sort((a, b) => a - b);
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
