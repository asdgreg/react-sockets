const { initializeApp } = require("firebase/app");
const { getFirestore } = require ("firebase/firestore");
const { doc, getDoc, setDoc } = require ("firebase/firestore");
// Add a second document with a generated ID.
const { addDoc, collection } = require("firebase/firestore");

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    projectId: "dev-process"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Insert new messages into the Redis cache
async function addMessageToCache2(roomName, msg) {
    // Check for current cache
    let room = await getRoomFromCache(roomName);
    if (room) {
      // Update old room
      room.messages.push(msg);
    } else {
      // Create a new room
      room = {
        room: roomName,
        messages: [msg],
      };
    }
    redisClient.set(roomName, JSON.stringify(room));
    // Insert message to the database as well
    addMessageToDb(room);
  }
  
  // Query Redis for messages for a specific room
  // If not in Redis, query the database
  async function getRoomFromCache(roomName) {
    if (!(await getData(roomName))) {
      const room = getRoomFromDatabase(roomName);
      if (room) {
        addData(roomName, room);
      }
    }
    return await getData(roomName);
  }



async function addMessageToCache(roomName, msg){
    // Check for current cache
    let room = await getRoomFromCache(roomName);
    if (room) {
      // Update old room
      room.messages.push(msg);
    } else {
      // Create a new room
      room = {
        room: roomName,
        messages: [msg],
      };
    }
    // redisClient.set(roomName, JSON.stringify(room));
    addData(roomName,room);
    // Insert message to the database as well
    addMessageToDb(room);

   return getData(roomName);
}

async function addData(roomName, data) {
    try {
        const result = await setDoc(doc(db, "chats", roomName), data);
        console.log(result);
        // await db.collection("chats").doc(roomName).set(
        //     JSON.parse(data)
        // ).then(function() {
        //     console.log("Room created");
        //   });
        } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function getData(roomName) {
    try {
        const docRef = doc(db, "chats", roomName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return docSnap.data();
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            return null
        }

        // await db.collection("chats").doc(roomName)
        // .get().then((doc) => {
        //   if (doc.exists){
        //     // Convert to room object
        //     var room = doc.data();
        //     // Use a room instance method
        //     console.log(room.toString());
        //     return room;
        //   } else {
        //     console.log("No such document!");
        //   }}).catch((error) => {
        //     console.log("Error getting document:", error);
        //   });
        } catch (e) {
        console.error("Error adding document: ", e);
    }
}


// In-memory database example -
// Production applications should use a persistent database such as Firestore
const messageDb = [
    {
      room: 'my-room',
      messages: [
        {user: 'Chris', text: 'Hi!'},
        {user: 'Chris', text: 'How are you!?'},
        {user: 'Megan', text: 'Doing well!'},
        {user: 'Chris', text: "That's great"},
      ],
    },
    {
      room: 'new-room',
      messages: [
        {user: 'Chris', text: 'The project is due tomorrow'},
        {user: 'Chris', text: 'I am wrapping up the final pieces'},
        {user: 'Chris', text: 'Are you ready for the presentation'},
        {user: 'Megan', text: 'Of course!'},
      ],
    },
  ];
  
  // Insert messages into the example database for long term storage
  async function addMessageToDb(data) {
    const room = messageDb.find(messages => messages.room === data.room);
    if (room) {
      // Update room in database
      Object.assign(room, data);
    } else {
      // Create new room in database
      messageDb.push(data);
    }
  }
  
  // Query the example database for messages for a specific room
  function getRoomFromDatabase(roomName) {
    return messageDb.find(messages => messages.room === roomName);
  }
  
  module.exports = {
    getRoomFromCache,
    addMessageToCache
  };
  