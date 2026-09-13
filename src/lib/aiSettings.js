import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const settingsRef = doc(db, 'siteSettings', 'aiAssistant')

export function subscribeToAiStatus(onChange, onError) {
  return onSnapshot(settingsRef, (snapshot) => {
    onChange(snapshot.exists() ? snapshot.data().enabled !== false : true)
  }, onError)
}

export function updateAiStatus(enabled) {
  return setDoc(settingsRef, { enabled, updatedAt: new Date().toISOString() }, { merge: true }).then(async () => {
    const snapshot = await getDoc(settingsRef)
    if (!snapshot.exists() || snapshot.data().enabled !== enabled) {
      throw new Error('AI assistant status was not persisted in Firestore.')
    }
  })
}
