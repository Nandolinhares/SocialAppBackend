const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./socialapp-5687a-firebase-adminsdk-9cx94-e41f0f937f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialapp-5687a.firebaseio.com"
});

const express = require('express');
const app = express();

//config = firebaseConfig aqui

const firebaseConfig = {
    apiKey: "AIzaSyC2Eb8OHlGk4OKTwZwlK8ClI6tp1EV2Mxs",
    authDomain: "socialapp-5687a.firebaseapp.com",
    databaseURL: "https://socialapp-5687a.firebaseio.com",
    projectId: "socialapp-5687a",
    storageBucket: "socialapp-5687a.appspot.com",
    messagingSenderId: "952155358719",
    appId: "1:952155358719:web:2a656712814c8602c093ca",
    measurementId: "G-PBYX1NZX3M"
  };

 
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req, res) => {
    db.collection('screams').orderBy('createdAt', 'desc').get()
    .then(data => {
        let screams = [];
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(screams);
    })
    .catch(err => console.error(err));
})

 app.post('/scream', (req, res) => {
   
     const newScream = {
         body: req.body.body,
         userHandle: req.body.userHandle,
         createdAt: new Date().toISOString()
     };

     db.collection('screams').add(newScream)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully` });
        })
        .catch(err => {
            res.status(500).json({ error: 'Something went wrong' });
            console.error(err);
        });
 });

 //Helper function
 const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
 }

 const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailRegEx)) return true;
    else return false;
 }

 //SignUp route
 app.post('/signup', (req, res) => {
     const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
     };

     //Validating email
     let errors = {};
     if(isEmpty(newUser.email)){
        errors.email = 'Email must not be empty';
     } else if(!isEmail(newUser.email)){
         errors.email = 'Must be a valid email address';
     }

     //Validating password
     if(isEmpty(newUser.password)) errors.password = 'Password must not be empty';
     if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must be the same';
     
     //Validating handle
     if(isEmpty(newUser.handle)) errors.handle = 'Handle must not be empty';

     if(Object.keys(errors).length > 0) return res.status(400).json(errors);
    
     //Se o nome de usuário já existir
     let token, userId;
     db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                return res.status(400).json({ handle: 'This handle is already taken' });
            } else{
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        }) //O usuário foi criado. Então vamos dar um token de acesso para o usuário requisitar depois mais dados
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email is already in use' });
            } else{
                return res.status(500).json({ error: err.code });
            }
        })
 });

 //Login route
 app.post('/login', (req, res) => {
     const user = {
         email: req.body.email,
         password: req.body.password
     };

     //Validating Login
     let errors = {};

     if(isEmpty(user.email)) errors.email = 'Must not be empty';
     if(isEmpty(user.password)) errors.password = 'Must not be empty';

     if(Object.keys(errors).length > 0) return res.status(400).json(errors);

     firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token });
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else {
                return res.status(500).json({ error: err.code });
            }
        })
 })

 exports.api = functions.https.onRequest(app);