from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

CROSSED_OUT_FILE = 'crossed_out.json'

def load_crossed_out():
    """Load crossed out numbers from file"""
    if os.path.exists(CROSSED_OUT_FILE):
        with open(CROSSED_OUT_FILE, 'r') as f:
            return json.load(f)
    return {'crossed_out': []}

def save_crossed_out(data):
    """Save crossed out numbers to file"""
    with open(CROSSED_OUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/add-crossed-out', methods=['POST'])
def add_crossed_out():
    """Add a number to the crossed out list"""
    try:
        data = request.json
        number = data.get('number')
        
        if not isinstance(number, int) or number < 1 or number > 1028:
            return jsonify({'error': 'Invalid number'}), 400
        
        crossed_data = load_crossed_out()
        
        if number not in crossed_data['crossed_out']:
            crossed_data['crossed_out'].append(number)
            crossed_data['crossed_out'].sort()
        
        save_crossed_out(crossed_data)
        return jsonify({'success': True, 'data': crossed_data})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
