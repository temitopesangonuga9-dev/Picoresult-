import { collection, doc, onSnapshot, setDoc, writeBatch, getDocs, deleteDoc } from "firebase/firestore";
import { db as firestoreDb } from "./firebase";
import { Database } from "../data";

// List of collections that correspond to Database arrays
const ARRAY_COLLECTIONS = [
  "admins",
  "students",
  "classes",
  "subjects",
  "teachers",
  "scores",
  "affectiveTraits",
  "psychomotorSkills",
  "subjectAssignments",
  "classTeacherAssignments",
  "scoreComponents"
];

export const syncDatabase = (onUpdate: (db: Database) => void, onError: (err: any) => void) => {
  const currentDb: Partial<Database> = {
    admins: [],
    students: [],
    classes: [],
    subjects: [],
    teachers: [],
    scores: [],
    affectiveTraits: [],
    psychomotorSkills: [],
    subjectAssignments: [],
    classTeacherAssignments: [],
    scoreComponents: [],
    sessions: [],
    terms: [],
    schoolSettings: {} as any,
    reportCardLayout: {} as any,
  };

  let loadedCollections = 0;
  const totalCollectionsCount = ARRAY_COLLECTIONS.length + 1; // arrays + settings/main
  const unsubs: (() => void)[] = [];
  let isFullyInitialized = false;

  const checkAndEmit = () => {
    if (loadedCollections >= totalCollectionsCount) {
      isFullyInitialized = true;
      onUpdate(currentDb as Database);
    }
  };

  // Listen to array collections
  ARRAY_COLLECTIONS.forEach((colName) => {
    const unsub = onSnapshot(collection(firestoreDb, colName), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data() }));
      (currentDb as any)[colName] = items;
      
      if (isFullyInitialized) {
        // Already fully initialized, emit update
        onUpdate(currentDb as Database);
      } else {
        loadedCollections++;
        checkAndEmit();
      }
    }, (err) => {
      console.error(`Sync error on collection ${colName}:`, err);
      onError(err);
    });
    unsubs.push(unsub);
  });

  // Listen to settings
  const unsubSettings = onSnapshot(doc(firestoreDb, "settings", "main"), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentDb.sessions = data.sessions || [];
      currentDb.terms = data.terms || [];
      currentDb.schoolSettings = data.schoolSettings || {} as any;
      currentDb.reportCardLayout = data.reportCardLayout || {} as any;
    }

    if (isFullyInitialized) {
      onUpdate(currentDb as Database);
    } else {
      loadedCollections++;
      checkAndEmit();
    }
  }, (err) => {
    console.error(`Sync error on settings/main:`, err);
    onError(err);
  });
  unsubs.push(unsubSettings);

  return () => unsubs.forEach(unsub => unsub());
};

export const saveDatabaseToFirestore = async (newDb: Database) => {
  // 1. Save settings
  await setDoc(doc(firestoreDb, "settings", "main"), {
    sessions: newDb.sessions,
    terms: newDb.terms,
    schoolSettings: newDb.schoolSettings,
    reportCardLayout: newDb.reportCardLayout,
  });

  // 2. Save array collections
  // For simplicity and to avoid complex diffing in this turn, 
  // we will update/set each item based on its ID.
  // Note: This won't delete items removed from the array unless we implement deletion.
  // However, for the current scale, we'll try a batch approach for important collections.
  
  const saveCollection = async (colName: string, items: any[], idKey: string = "id") => {
    if (!items) return;

    // 1. Determine all doc IDs from the new data
    const newItemIds = new Set<string>();
    items.forEach(item => {
      let docId = "";
      if (colName === "scores") {
        docId = `${item.studentId}_${item.subjectId}_${item.session}_${item.term}`.replace(/\//g, "-");
      } else if (colName === "affectiveTraits" || colName === "psychomotorSkills") {
        docId = `${item.studentId}_${item.session}_${item.term}`.replace(/\//g, "-");
      } else {
        docId = item[idKey];
      }
      if (docId) newItemIds.add(docId);
    });

    // 2. Fetch current docs from Firestore to find orphans
    const snapshot = await getDocs(collection(firestoreDb, colName));
    const currentDocIds = snapshot.docs.map(doc => doc.id);
    const toDelete = currentDocIds.filter(id => !newItemIds.has(id));

    // 3. Batch delete orphans
    if (toDelete.length > 0) {
      const deleteChunks = [];
      for (let i = 0; i < toDelete.length; i += 500) {
        deleteChunks.push(toDelete.slice(i, i + 500));
      }
      for (const chunk of deleteChunks) {
        const batch = writeBatch(firestoreDb);
        chunk.forEach(id => batch.delete(doc(firestoreDb, colName, id)));
        await batch.commit();
      }
    }

    // 4. Batch set/update items
    // Firestore batch limit is 500
    const chunks = [];
    for (let i = 0; i < items.length; i += 500) {
      chunks.push(items.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(firestoreDb);
      chunk.forEach((item) => {
        // Scores and Traits don't always have a single 'id', they might use a composite key
        let docId = "";
        if (colName === "scores") {
          docId = `${item.studentId}_${item.subjectId}_${item.session}_${item.term}`.replace(/\//g, "-");
        } else if (colName === "affectiveTraits" || colName === "psychomotorSkills") {
          docId = `${item.studentId}_${item.session}_${item.term}`.replace(/\//g, "-");
        } else {
          docId = item[idKey];
        }
        
        if (docId) {
          batch.set(doc(firestoreDb, colName, docId), item);
        }
      });
      await batch.commit();
    }
  };

  await Promise.all([
    saveCollection("admins", newDb.admins),
    saveCollection("students", newDb.students),
    saveCollection("classes", newDb.classes),
    saveCollection("subjects", newDb.subjects),
    saveCollection("teachers", newDb.teachers),
    saveCollection("scores", newDb.scores),
    saveCollection("affectiveTraits", newDb.affectiveTraits),
    saveCollection("psychomotorSkills", newDb.psychomotorSkills),
    saveCollection("subjectAssignments", newDb.subjectAssignments),
    saveCollection("classTeacherAssignments", newDb.classTeacherAssignments),
    saveCollection("scoreComponents", newDb.scoreComponents || []),
  ]);
};
