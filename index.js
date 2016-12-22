const request = require('request');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const config = require('./config');

let localStores = config.stores
let success;

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(config.email.smtp);

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
  success = {};
  const options = {
    method: 'GET',
    url: config.iStockUrl,
    json: true,
  }
  return request(options, (error, response, body) => {
    if (error) {
      return console.error(error)
    }
    let stores = body.dataz || {};
    Object.keys(stores).forEach((store) => {
      if (Object.keys(localStores).includes(store) && stores[store].live === 1) {
        let name = localStores[store];
        success[name] = true;
        console.log( 'stores[store]:', stores[store] );
      }
    })

    console.log( 'available stores', Object.keys(success) );
    if(Object.keys(success).length > 0) {
      console.log( 'were good' );
      // setup e-mail data with unicode symbols
      const mailOptions = {
          from: config.email.from, // sender address
          to: config.email.to, // list of receivers
          subject: `AirPods in stock ✔ at ${now()}`, // Subject line
          text: JSON.stringify(success), // plaintext body
          // html: '<b>Hello world 🐴</b>' // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
          if(error){
              return console.log(error);
          }
          console.log('Message sent: ' + info.response);
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
