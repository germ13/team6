'use strict';

const WatsonServices = require('./watson');
const options = require('./options');

// initialize and use watson services
const Watson = new WatsonServices(options, () => {
  let spaces = 
  Watson.listSpaces((s) => {
    console.log("really inside: ", s);
  });

  // console.log(spaces);

  // console.log('inside: ', spaces);
  console.log("hey, i'm done");
});

