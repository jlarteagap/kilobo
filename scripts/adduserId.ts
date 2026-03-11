// Importaciones básicas
import { adminDb } from '../src/lib/firebase.admin';

const USER_ID = 'tZxZeQwHgbOy4096bSqhfcjDxBp2';

const collectionsToUpdate = [
  'accounts',
  'transactions',
  'category',
  'debts',
  'debt_payments'
];

async function addUserIdToCollections() {
  console.log(`Iniciando la actualización para agregar user_id: ${USER_ID} a todos los documentos...`);

  for (const collectionName of collectionsToUpdate) {
    console.log(`\nProcesando colección: ${collectionName}`);
    
    try {
      const collectionRef = adminDb.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      if (snapshot.empty) {
        console.log(`No se encontraron documentos en ${collectionName}`);
        continue;
      }

      console.log(`Se encontraron ${snapshot.size} documentos en ${collectionName}. Actualizando...`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      let batch = adminDb.batch();
      let currentBatchSize = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Evitamos sobrescribir si ya tiene este user_id
        if (data.user_id !== USER_ID) {
          batch.update(doc.ref, { user_id: USER_ID });
          updatedCount++;
          currentBatchSize++;
          
          // Límite de operaciones en un batch de Firestore es 500
          if (currentBatchSize === 490) {
            await batch.commit();
            console.log(`  -> Commit de batch con ${currentBatchSize} actualizaciones...`);
            batch = adminDb.batch(); // Crear nuevo batch
            currentBatchSize = 0;
          }
        } else {
          skippedCount++;
        }
      }

      // Commit de las operaciones restantes
      if (currentBatchSize > 0) {
        await batch.commit();
        console.log(`  -> Commit final de batch con ${currentBatchSize} actualizaciones.`);
      }

      console.log(`Finalizó el procesamiento de ${collectionName}. Actualizados: ${updatedCount}, Omitidos (ya tenían el user_id): ${skippedCount}`);
    } catch (error) {
      console.error(`Error procesando la colección ${collectionName}:`, error);
    }
  }

  console.log('\n¡Todas las colecciones procesadas con éxito!');
  process.exit(0);
}

addUserIdToCollections();