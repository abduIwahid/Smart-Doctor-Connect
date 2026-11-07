# SmartDoctor AI — Smart Doctor Connect

**SmartDoctor AI** is an AI-powered doctor recommendation platform for Pakistan, built during the **Mind-to-Machine (MTM) AI Hackathon 2026** at COMSATS University Islamabad, Wah Campus. Describe your symptoms and it recommends suitable doctors from a local dataset.

**Live demo:** [smartdoctor-ai.vercel.app](https://smartdoctor-ai.vercel.app)

## Features

- **Symptom-based recommendations** — the Gemini API matches the described symptoms to doctor specialties
- **Local doctor dataset** — doctors stored in `data/doctors.json` (name, specialty, city, and more)
- **Lightweight stack** — a single Express server serves the API and the static frontend; no build step
- **Responsive UI** — works on desktop and mobile

## Tech stack

- **Backend:** Node.js + Express (`server.js`)
- **Frontend:** Static HTML/CSS/JS (`public/index.html`)
- **AI:** Google Gemini API
- **Data:** JSON file (`data/doctors.json`)
- **Deployment:** Vercel (`vercel.json`)

## Run locally

```bash
git clone https://github.com/abduIwahid/Smart-Doctor-Connect.git
cd Smart-Doctor-Connect
npm install
```

Create a `.env` file with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

Then start the server:

```bash
npm start        # or: npm run dev  (nodemon, auto-restart)
```

## Author

**Abdul Wahid** — AI/ML developer and BS Artificial Intelligence student at COMSATS University Islamabad (Attock Campus), focused on machine learning, data structures, and problem solving.

*"Empowering healthcare through the lens of Machine Learning."*
