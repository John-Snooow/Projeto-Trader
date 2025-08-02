
import express from 'express';
import cors from 'cors';
import chokidar from 'chokidar';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres', // ajuste conforme seu ambiente
  host: 'localhost',
  database: 'dashboard',
  password: 'postgres', // ajuste conforme seu ambiente
  port: 5432,
});

// Criação da tabela se não existir
const createTable = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS dados_pdf (
    id SERIAL PRIMARY KEY,
    nome_arquivo TEXT,
    conteudo TEXT,
    data_importacao TIMESTAMP DEFAULT NOW()
  )`);
};
createTable();

// Função para processar PDF e salvar no banco
async function processarPDF(filePath) {
  // Verifica se o arquivo realmente existe e é PDF
  if (!fs.existsSync(filePath) || !filePath.endsWith('.pdf')) {
    console.warn('Arquivo não encontrado ou não é PDF:', filePath);
    return;
  }
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    await pool.query(
      'INSERT INTO dados_pdf (nome_arquivo, conteudo) VALUES ($1, $2)',
      [path.basename(filePath), data.text]
    );
  } catch (err) {
    console.error('Erro ao ler ou processar PDF:', filePath, err);
  }
}

// Monitorar a pasta PDFs-historico
const pdfDir = path.join(__dirname, '../PDFs-historico');
chokidar.watch(pdfDir, { persistent: true, ignoreInitial: false })
  .on('add', async (filePath) => {
    if (filePath.endsWith('.pdf')) {
      try {
        await processarPDF(filePath);
        console.log('PDF processado:', filePath);
      } catch (err) {
        console.error('Erro ao processar PDF:', err);
      }
    }
  });

// Endpoint para buscar dados processados
app.get('/api/dados', async (req, res) => {
  const result = await pool.query('SELECT * FROM dados_pdf ORDER BY data_importacao DESC');
  res.json(result.rows);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
