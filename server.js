
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const doctorsPath = path.join(__dirname, 'data', 'doctors.json');

const readDoctors = () => {
  const raw = fs.readFileSync(doctorsPath, 'utf-8');
  return JSON.parse(raw);
};

const saveDoctors = (data) => {
  fs.writeFileSync(doctorsPath, JSON.stringify(data, null, 2));
};

let doctors = readDoctors();
let nextId = doctors.length + 1;

const symptomMap = {
  'chest pain': ['Cardiologist', 'General Practitioner'],
  'heart': ['Cardiologist'],
  'blood pressure': ['Cardiologist'],
  'palpitations': ['Cardiologist'],
  'skin': ['Dermatologist'],
  'rash': ['Dermatologist'],
  'eczema': ['Dermatologist'],
  'acne': ['Dermatologist'],
  'joint pain': ['Orthopedic'],
  'fracture': ['Orthopedic'],
  'back pain': ['Orthopedic', 'General Practitioner'],
  'migraine': ['Neurologist'],
  'headache': ['Neurologist', 'General Practitioner'],
  'dizziness': ['Neurologist'],
  'seizure': ['Neurologist'],
  'child fever': ['Pediatrician'],
  'vaccination': ['Pediatrician'],
  'cough': ['General Practitioner'],
  'fever': ['General Practitioner'],
  'diabetes': ['General Practitioner']
};

async function getGeminiRecommendation(symptoms, location, specializations) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const prompt = `
You are a medical recommendation assistant for Pakistan.
Symptoms: ${symptoms}
Preferred location: ${location || 'Any city in Pakistan'}
Relevant specializations: ${specializations.join(', ')}

Provide a short recommendation in English about which type of doctor the patient should consult.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return null;
  }
}

app.get('/api/doctors', (req, res) => {
  doctors = readDoctors();
  res.json(doctors);
});

app.get('/api/doctors/:id', (req, res) => {
  doctors = readDoctors();
  const doctor = doctors.find(doc => doc.id === parseInt(req.params.id));

  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  res.json(doctor);
});

app.get('/api/doctors/search/:query', (req, res) => {
  doctors = readDoctors();
  const query = req.params.query.toLowerCase();

  const results = doctors.filter(doc =>
    doc.name.toLowerCase().includes(query) ||
    doc.specialization.toLowerCase().includes(query) ||
    doc.location.toLowerCase().includes(query) ||
    doc.hospital.toLowerCase().includes(query)
  );

  res.json(results);
});

app.post('/api/doctors/filter', (req, res) => {
  doctors = readDoctors();

  const { specialization, location, consultationType, minRating } = req.body;

  const filtered = doctors.filter(doc => {
    return (!specialization || doc.specialization === specialization) &&
      (!location || doc.location.toLowerCase().includes(location.toLowerCase())) &&
      (!consultationType || doc.consultationType === consultationType) &&
      (!minRating || doc.rating >= minRating);
  });

  res.json(filtered);
});

app.post('/api/recommend-doctor', async (req, res) => {
  doctors = readDoctors();

  const { symptoms, location } = req.body;

  if (!symptoms) {
    return res.status(400).json({ error: 'Please describe your symptoms in English.' });
  }

  const lowerSymptoms = symptoms.toLowerCase();
  let matchedSpecializations = [];

  Object.keys(symptomMap).forEach(keyword => {
    if (lowerSymptoms.includes(keyword)) {
      matchedSpecializations = [...matchedSpecializations, ...symptomMap[keyword]];
    }
  });

  matchedSpecializations = [...new Set(matchedSpecializations)];

  if (matchedSpecializations.length === 0) {
    matchedSpecializations = ['General Practitioner'];
  }

  let recommended = doctors.filter(doc => {
    const specializationMatch = matchedSpecializations.includes(doc.specialization);
    const locationMatch = !location || doc.location.toLowerCase().includes(location.toLowerCase());

    return specializationMatch && locationMatch;
  });

  if (recommended.length === 0) {
    recommended = doctors.filter(doc =>
      matchedSpecializations.includes(doc.specialization)
    );
  }

  const aiAdvice = await getGeminiRecommendation(
    symptoms,
    location,
    matchedSpecializations
  );

  const topRecommendations = recommended
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  res.json({
    aiAdvice: aiAdvice || 'Consult a qualified doctor for a complete medical evaluation.',
    matchedSpecializations,
    recommendations: topRecommendations
  });
});

app.post('/api/doctors', (req, res) => {
  doctors = readDoctors();

  const {
    name,
    specialization,
    location,
    consultationType,
    experience,
    hospital,
    email,
    phone,
    bio
  } = req.body;

  if (!name || !specialization || !location || !consultationType) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const newDoctor = {
    id: nextId++,
    name,
    specialization,
    location,
    consultationType,
    experience: experience || 0,
    rating: 0,
    hospital: hospital || '',
    email: email || '',
    phone: phone || '',
    bio: bio || ''
  };

  doctors.push(newDoctor);
  saveDoctors(doctors);

  res.status(201).json({
    message: 'Doctor added successfully.',
    doctor: newDoctor
  });
});

app.get('/api/symptoms', (req, res) => {
  res.json({
    symptoms: Object.keys(symptomMap),
    message: 'Use these symptoms to receive Use these symptoms to receive Gemini AI powered doctor recommendations.'
  });
});

app.listen(PORT, () => {
  console.log(`Smart Doctor Connect is running at http://localhost:${PORT}`);
});

module.exports = app;
