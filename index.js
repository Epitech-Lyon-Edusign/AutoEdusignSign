// Import statements with ES Module syntax
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import fetch from 'node-fetch';

// Define constants for file paths and scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const SIGNATURE_FILE_PATH = path.join(process.cwd(), 'signature.txt');

// Load or save credentials
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        console.error("Error loading saved credentials: ", err);
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

// Authenticate and return a client
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

// Main function to get the latest email and make a POST request
async function getLatestEmailWithSubject(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const subject = "EPITECH vous a envoyé un lien de signature";
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: `subject:"${subject}"`,
        });

        if (!response.data.messages) {
            console.log("No emails found with the specified subject.");
            return;
        }

        const message = await gmail.users.messages.get({
            userId: 'me',
            id: response.data.messages[0].id,
            format: 'full'
        });

        const parts = message.data.payload.parts || [];
        let bodyText = parts.map(part => Buffer.from(part.body.data, 'base64').toString('utf8')).join('');

        const urlPattern = /https:\/\/static\.edusign\.com\/student\/email-signature\/\?courseId=([^&]+)&studentId=([^&]+)&verificationToken=([^\s&>]+)/;
        const match = bodyText.match(urlPattern);

        if (match) {
            const courseId = match[1];
            const studentId = match[2];
            const verificationToken = match[3];

            const base64Signature = await fs.readFile(SIGNATURE_FILE_PATH, 'utf8');

            const url = `https://api.edusign.fr/student/courses/email/setStudentPresent/${courseId}?verificationToken=${verificationToken}`;
            const payload = JSON.stringify({
                studentId: studentId,
                schoolId: "061boga596exny4t",
                base64Signature: base64Signature.trim()
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Priority': 'u=1'
                },
                body: payload
            });

            const jsonResponse = await response.json();
            console.log(jsonResponse);

        } else {
            console.log("No matching URL found.");
        }
    } catch (error) {
        console.error("The API returned an error: ", error);
    }
}

// Run the main function repeatedly every 5 minutes
authorize().then(auth => {
    setInterval(() => {
        getLatestEmailWithSubject(auth).catch(console.error);
    }, 60000);  // 60000 milliseconds = 1 minutes
}).catch(console.error);














// JS code to get the token.js file



// const fs = require('fs').promises;
// const path = require('path');
// const process = require('process');
// const {authenticate} = require('@google-cloud/local-auth');
// const {google} = require('googleapis');

// // If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// // The file token.json stores the user's access and refresh tokens, and is
// // created automatically when the authorization flow completes for the first
// // time.
// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
// const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// /**
//  * Reads previously authorized credentials from the save file.
//  *
//  * @return {Promise<OAuth2Client|null>}
//  */
// async function loadSavedCredentialsIfExist() {
//   try {
//     const content = await fs.readFile(TOKEN_PATH);
//     const credentials = JSON.parse(content);
//     return google.auth.fromJSON(credentials);
//   } catch (err) {
//     return null;
//   }
// }

// /**
//  * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
//  *
//  * @param {OAuth2Client} client
//  * @return {Promise<void>}
//  */
// async function saveCredentials(client) {
//   const content = await fs.readFile(CREDENTIALS_PATH);
//   const keys = JSON.parse(content);
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: 'authorized_user',
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });
//   await fs.writeFile(TOKEN_PATH, payload);
// }

// /**
//  * Load or request or authorization to call APIs.
//  *
//  */
// async function authorize() {
//   let client = await loadSavedCredentialsIfExist();
//   if (client) {
//     return client;
//   }
//   client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
//   });
//   if (client.credentials) {
//     await saveCredentials(client);
//   }
//   return client;
// }

// /**
//  * Lists the labels in the user's account.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// async function listLabels(auth) {
//   const gmail = google.gmail({version: 'v1', auth});
//   const res = await gmail.users.labels.list({
//     userId: 'me',
//   });
//   const labels = res.data.labels;
//   if (!labels || labels.length === 0) {
//     console.log('No labels found.');
//     return;
//   }
//   console.log('Labels:');
//   labels.forEach((label) => {
//     console.log(`- ${label.name}`);
//   });
// }

// authorize().then(listLabels).catch(console.error);
