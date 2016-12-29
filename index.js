const request = require('request');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const config = require('./config');
const _ = require('lodash');

let localStores = config.stores
let success;

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(config.email.smtp);
const airPodUrl = `http://www.apple.com/us/shop/go/product/MMEF2`;

verifyNodeMailer();

// Set up Schedulers
const verify = schedule.scheduleJob('0 * * * *', () => {
  verifyNodeMailer()
})

const check = schedule.scheduleJob('* * * * *', () => {
  queryISTockNow();
  console.log('querying istocknow');
});

// functions
function queryISTockNow() {
  success = [];
  const requestOptions = {
    method: 'GET',
    url: config.iStockUrl,
    json: true,
  }
  return request(requestOptions, (error, response, body) => {
    if (error) {
      return console.error(error)
    }
    let stores = body.dataz || {};
    Object.keys(stores).forEach((store) => {
      localStores.forEach(localStore => {
        if (localStore.id === store && stores[store].live === 1) {
          localStore.website = airPodUrl;
          success.push(localStore);
        console.log( 'stores[store]:', stores[store] );
      }
      })
    })

    let b = _.chain(success)
      .groupBy('email')
      .value();

    if(Object.keys(b)) {
      Object.keys(b).forEach(email => {
        console.log('email', email)
      // setup e-mail data with unicode symbols
        const mailrequestOptions = {
          from: config.email.from, // sender address
          to: email, // list of receivers
          subject: `AirPods in stock ✔ at ${now()}`, // Subject line
          text: JSON.stringify(b[email]), // plaintext body
          // html: '<b>Hello world 🐴</b>' // html body
      };

      // send mail with defined transport object
        transporter.sendMail(mailrequestOptions, (error, info) => {
          if(error){
              return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });
      });
    } else {
      console.log( `no airpods available at ${now()}` );
    }
  })
}

function verifyNodeMailer() {
  transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log(`Server is ready to take our messages, ${now()}`);
    }
  });
}

function now() {
  return new Date().toLocaleTimeString();
}
