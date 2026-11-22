/**
 * Script d'ingestion des flux OpenData de Paris & Génération des Fallbacks locaux
 * Exécution: node scripts/fetch-fallback-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DATA_DIR = path.resolve(__dirname, '../public/data');

const ENDPOINTS = [
  {
    name: 'SSP & CASVP (Services Sociaux de Proximité et CASVP)',
    url: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/coordonnees-ssp-et-casvp/exports/geojson',
    filename: 'coordonnees-ssp-et-casvp.fallback.geojson'
  },
  {
    name: 'Hébergements CASVP (CHU / CHRS)',
    url: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/hebergements-casvp/exports/geojson',
    filename: 'hebergements-casvp.fallback.geojson'
  }
];

async function syncFallbackData() {
  console.log('🌙 [Clair de Lune] Synchronisation des données OpenData Paris vers fallback local...');

  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }

  for (const endpoint of ENDPOINTS) {
    const destPath = path.join(PUBLIC_DATA_DIR, endpoint.filename);
    console.log(`📡 Téléchargement de "${endpoint.name}" depuis :`);
    console.log(`   ${endpoint.url}`);

    try {
      const response = await fetch(endpoint.url, {
        headers: { 'Accept': 'application/geo+json, application/json' },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const geojson = await response.json();
      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        throw new Error('Format GeoJSON invalide (FeatureCollection attendue)');
      }

      fs.writeFileSync(destPath, JSON.stringify(geojson, null, 2), 'utf-8');
      console.log(`✅ Succès : ${geojson.features.length} entités enregistrées dans ${endpoint.filename}`);
    } catch (err) {
      console.error(`❌ Échec pour ${endpoint.name}:`, err.message);
      if (!fs.existsSync(destPath)) {
        console.warn(`⚠️ Aucun fichier existant pour ${endpoint.filename}.`);
      }
    }
  }

  console.log('✨ [Clair de Lune] Synchronisation terminée.');
}

syncFallbackData();
