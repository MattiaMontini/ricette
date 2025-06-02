require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const auth = require('./middleware/auth');
const jwt = require('./middleware/jwt');

const multer = require('multer');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors({
  origin: 'https://ricette.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

let database;

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ricette',           // cartella su Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const upload = multer({ storage });

// Connessione al DB
const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    console.log("Connected to Database");
    return client.db('mongodb');
  } catch (error) {
    console.log("Error connecting to Database\n");
    console.log(error);
    process.exit(1);
  }
}

// Avvio server
const startServer = async () => {
  database = await connectToDatabase();
  app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
  })
}
startServer();

// Rotta per vedere tutte le ricette
app.get('/ricette', async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const result = await database.collection('ricette').find({}).toArray();
    const ricette = result.map(ricetta => ({
      id: ricetta._id,
      titolo: ricetta.titolo,
      autore: ricetta.autore,
      tempoPreparazione: ricetta.tempoPreparazione,
      tempoCottura: ricetta.tempoCottura,
      porzioni: ricetta.porzioni,
      categoria: ricetta.categoria,
      difficolta: ricetta.difficolta,
      immagine: ricetta.immagine,
    }));
    res.json(ricette);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching recipes' });
  }
});

// Rotta per vedere una ricetta in particolare
app.get('/ricette/:id', async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID non valido' });
    }
    const result = await database.collection('ricette').findOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching recipe' });
  }
});

// Rotta lista spesa personalizzata
app.post('/lista-spesa', async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database not connected' });
  }

  const { ricette, persone } = req.body;

  if (!Array.isArray(ricette) || typeof persone !== 'number' || persone <= 0) {
    return res.status(400).json({ error: 'Richiesta non valida. Fornisci una ricetta esistente e un numero di persone.' });
  }

  try {
    const objectIds = ricette.map(id => new ObjectId(id));
    const results = await database.collection('ricette').find({ _id: { $in: objectIds } }).toArray();

    const listaSpesa = {};

    for (const ricetta of results) {
      const moltiplicatore = persone / ricetta.porzioni;

      for (const ingrediente of ricetta.ingredienti) {
        const nome = ingrediente.nome;
        const quantita = ingrediente.quantita;

        if (quantita.toLowerCase() === 'q.b.') {
          listaSpesa[nome] = 'q.b.';
          continue;
        }

        const match = quantita.match(/^([\d.,]+)\s*(\w*)$/);
        if (!match) continue;

        const valore = parseFloat(match[1].replace(',', '.'));
        const unita = match[2];

        if (!listaSpesa[nome] || listaSpesa[nome] === 'q.b.') {
          listaSpesa[nome] = {
            valore: valore * moltiplicatore,
            unita: unita
          };
        } else {
          listaSpesa[nome].valore += valore * moltiplicatore;
        }
      }
    }

    const listaFinale = Object.entries(listaSpesa).map(([nome, val]) => {
      if (val === 'q.b.') {
        return { nome, quantita: 'q.b.' };
      } else {
        return {
          nome,
          quantita: `${Math.round(val.valore)}${val.unita ? ' ' + val.unita : ''}`
        };
      }
    });

    res.json(listaFinale);
  } catch (error) {
    console.error('Errore nella generazione della lista della spesa:', error);
    res.status(500).json({ error: 'Errore nella generazione della lista della spesa' });
  }
});

app.get('/categorie', async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const results = await database.collection('ricette').distinct('categoria');
    res.json(results);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Rotta per creare nuova ricetta con upload immagine su Cloudinary
app.post('/ricette', auth, upload.single('immagine'), async (req, res) => {
  if (!database) return res.status(500).json({ error: 'Database not connected' });

  const {
    titolo,
    autore,
    tempoPreparazione,
    tempoCottura,
    porzioni,
    categoria,
    difficolta,
    ingredienti,
    istruzioni
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Immagine mancante' });
  }

  if (!titolo || !porzioni || !ingredienti || !istruzioni) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  const porzioniNum = Number(porzioni);
  if (isNaN(porzioniNum) || porzioniNum <= 0) {
    return res.status(400).json({ error: 'Porzioni non valide' });
  }

  const difficoltaNum = Number(difficolta);
  if (isNaN(difficoltaNum) || difficoltaNum < 1 || difficoltaNum > 5) {
    return res.status(400).json({ error: 'Difficoltà non valida' });
  }

  let parsedIngredienti, parsedIstruzioni;
  try {
    parsedIngredienti = typeof ingredienti === 'string' ? JSON.parse(ingredienti) : ingredienti;
    parsedIstruzioni = typeof istruzioni === 'string' ? JSON.parse(istruzioni) : istruzioni;
  } catch {
    return res.status(400).json({ error: 'Ingredienti o istruzioni non validi' });
  }

  try {
    const newRicetta = {
      titolo,
      autore: autore || null,
      tempoPreparazione: tempoPreparazione || null,
      tempoCottura: tempoCottura || null,
      porzioni: porzioniNum,
      categoria: categoria || null,
      difficolta: difficoltaNum,
      immagine: req.file.path,  // URL Cloudinary
      ingredienti: parsedIngredienti,
      istruzioni: parsedIstruzioni,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    const result = await database.collection('ricette').insertOne(newRicetta);

    res.status(201).json({
      message: 'Ricetta creata con successo',
      id: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Errore nella creazione della ricetta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono richiesti.' });
  }

  try {
    const user = await database.collection('utenti').findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Password errata.' });
    }

    const token = jwt.generateToken({ id: user._id.toString(), nome: user.nome });

    const userData = {
      id: user._id.toString(),
      nome: user.nome,
      cognome: user.cognome,
      email: user.email
    };

    res.json({ token, user: userData });

  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore interno.' });
  }
});

// Registrazione
app.post('/api/registrazione', async (req, res) => {
  const { nome, cognome, email, password } = req.body;

  if (!nome || !cognome || !email || !password) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  try {
    const existingUser = await database.collection('utenti').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Utente già registrato' });
    }

    const result = await database.collection('utenti').insertOne({
      nome,
      cognome,
      email,
      password
    });

    res.status(201).json({ message: 'Utente registrato con successo' });

  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore interno' });
  }
});



// Aggiunge ingredienti al carrello
app.post('/api/carrello', auth, async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database non connesso' });
  }

  const { ingredienti } = req.body;

  if (!Array.isArray(ingredienti) || ingredienti.length === 0) {
    return res.status(400).json({ error: 'Lista ingredienti non valida' });
  }

  try {
    const utenteId = req.user.id;

    // Salva il carrello come documento separato per ogni utente o sessione
    await database.collection('carrello').insertOne({
      utenteId: new ObjectId(utenteId),
      ingredienti,
      data: new Date()
    });

    res.status(201).json({ messaggio: 'Ingredienti aggiunti al carrello' });
  } catch (error) {
    console.error('Errore salvataggio carrello:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del carrello' });
  }
});

// Recupera ingredienti del carrello dell’utente loggato
app.get('/api/carrello', auth, async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database non connesso' });
  }

  try {
    const utenteId = req.user.id;

    const carrelli = await database.collection('carrello')
      .find({ utenteId: new ObjectId(utenteId) })
      .sort({ data: -1 })
      .toArray();

    // Unisci gli ingredienti (opzionale)
    const ingredientiTotali = {};

    carrelli.forEach(entry => {
      entry.ingredienti.forEach(({ nome, quantita, unita }) => {
        if (!ingredientiTotali[nome]) {
          ingredientiTotali[nome] = { quantita, unita };
        } else {
          const n1 = parseFloat(ingredientiTotali[nome].quantita);
          const n2 = parseFloat(quantita);
          if (!isNaN(n1) && !isNaN(n2)) {
            ingredientiTotali[nome].quantita = (n1 + n2).toString();
          }
        }
      });
    });

    const risultato = Object.entries(ingredientiTotali).map(([nome, valore]) => ({
      nome,
      ...valore
    }));

    res.json(risultato);
  } catch (error) {
    console.error('Errore nel recupero del carrello:', error);
    res.status(500).json({ error: 'Errore durante il recupero del carrello' });
  }
});

// Svuota il carrello dell'utente loggato
app.delete('/api/carrello', auth, async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database non connesso' });
  }

  try {
    const utenteId = req.user.id;

    // Elimina tutte le entry del carrello relative all'utente
    const result = await database.collection('carrello').deleteMany({ utenteId: new ObjectId(utenteId) });

    res.status(200).json({ messaggio: `Carrello svuotato (${result.deletedCount} elementi rimossi)` });
  } catch (error) {
    console.error('Errore nello svuotamento del carrello:', error);
    res.status(500).json({ error: 'Errore durante lo svuotamento del carrello' });
  }
});

// Rimuove un singolo ingrediente dal carrello dell'utente loggato
app.delete('/api/carrello/:nomeIngrediente', auth, async (req, res) => {
  if (!database) {
    return res.status(500).json({ error: 'Database non connesso' });
  }

  const utenteId = req.user.id;
  const nomeIngrediente = decodeURIComponent(req.params.nomeIngrediente);

  try {
    // Rimuove l'ingrediente dai documenti dove è presente
    const result = await database.collection('carrello').updateMany(
      { utenteId: new ObjectId(utenteId) },
      { $pull: { ingredienti: { nome: nomeIngrediente } } }
    );

    res.status(200).json({ messaggio: `Ingrediente "${nomeIngrediente}" rimosso da ${result.modifiedCount} documenti` });
  } catch (error) {
    console.error('Errore nella rimozione dell’ingrediente:', error);
    res.status(500).json({ error: 'Errore nella rimozione dell’ingrediente dal carrello' });
  }
});

