'use strict';
const request = require('request');

function WatsonServices(APPID, SECRET, onReady) {
  this.APPID = APPID;
  this.SECRET = SECRET;
  this.watsonEndpointUrl = 'https://api.watsonwork.ibm.com';
  this.readyState = false;
  this.token = undefined;

  // get token and prepare for servicing
  this.init = (onInitialized) => {
    // autenticate and get token
    this.getToken(onInitialized);
  };

  this.getToken = (cb) => {
    console.log('getting token');

    request.post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: this.APPID,
        pass: this.SECRET,
      },
      json: true,
      form: {
        grant_type: 'client_credentials',
      },
    }, (err, res) => {
      if (err || res.statusCode !== 200) {
        console.log('Error getting OAuth token %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      this.token = res.body.access_token;
      cb();
    });
  };

  // initialize and activate
  this.init(() => {
    console.log(`token: ${this.token}`);
    this.readyState = true;
    console.log('WatsonServices initialized');
    onReady();
  });

  // everything in the return object is exposed to callers
  return {
    readyState: this.readyState,
    listSpaces: (cb) => {
      if (!this.readyState) {
        throw new Error('WatsonServices is not initialized or ready');
      }

      request.post(`${this.watsonEndpointUrl}/graphql`, {
        headers: {
          jwt: this.token,
          'Content-Type': 'application/graphql',
        },
        // This is a GraphQL query, used to retrieve the list of spaces
        // visible to the app (given the app OAuth token)
        body: '\n      query {\n        spaces (first: 50) {\n          items {\n            title\n            id\n          }\n        }\n      }'
      }, (err, res) => {
        if (err || res.statusCode !== 200) {
          console.log('Error retrieving spaces %o', err || res.statusCode);
          cb(err || new Error(res.statusCode));
          return;
        }

        // Return the list of spaces
        const body = JSON.parse(res.body);
        //console.log(body);
        const spaces = body.data.spaces.items;
        // console.log('Space query result %o', body.data.spaces.items);
        //console.log(`listing spaces: ${spaces}`);
        cb(spaces);
      });
    },
    getConversation: (spaceId, cb) => {
      request.post(`${this.watsonEndpointUrl}/graphql`, {
        headers: {
          jwt: this.token,
          'Content-Type': 'application/graphql',
        },

        body: 'query getSpace {  space(id: "' +spaceId + '") {    title    description    membersUpdated    members {      items {        email        displayName      }    }    conversation{  id    messages{        items {          content        }      }    }}}'
      }, (err, res) => {
        if (err || res.statusCode !== 200) {
          console.log('Error retrieving spaces %o', err || res.statusCode);
          cb(err || new Error(res.statusCode));
          return;
        }

        // Return the list of spaces
        const body = JSON.parse(res.body);
        console.dir("body: " + body.data.space);
        const space = body.data.space;
        const conversation =space.conversation;

        //conversation.forEach( (c) => console.log(c));
        console.log(`listing conversation: ${conversation.id}`);
        cb(conversation.id);
      });



    },
    getMembersInSpace: (spaceId, cb) => {
      // if (!this.readyState) {
      //   throw new Error('WatsonServices is not initialized or ready');
      // }

      request.post(`${this.watsonEndpointUrl}/graphql`, {
        headers: {
          jwt: this.token,
          'Content-Type': 'application/graphql',
        },

        body: 'query getSpace { space(id: "' + spaceId + '") { title description membersUpdated members { items { email displayName}}conversation{messages{items {content}}}}}'
      },
        (err, res) => {
          if (err || res.statusCode !== 200) {
            console.log('Error retrieving spaces %o', err || res.statusCode);
            cb(err || new Error(res.statusCode));
            return;
          }

          // Return the list of members
          const body = JSON.parse(res.body);
          console.log(body);
          const mem = body.data;

          console.log(`listing members: ${mem}`);
          cb(mem);
        });
    },

    // Send an app message to the conversation in a space
    sendMessage: (spaceId, text, cb) => {
      request.post(`${this.watsonEndpointUrl}/v1/spaces/${spaceId}/messages`, {
        headers: {
          Authorization: 'Bearer ' + this.token
        },
        json: true,
        // An App message can specify a color, a title, markdown text and
        // an 'actor' useful to show where the message is coming from
        body: {
          type: 'appMessage',
          version: 1.0,
          annotations: [{
            type: 'generic',
            version: 1.0,

            color: '#6CB7FB',
            title: 'Sample Message',
            text: text,

            actor: {
              name: 'Team 6',
              avatar: 'https://avatars1.githubusercontent.com/u/22985179',
              url: 'https://github.com/watsonwork-helloworld'
            }
          }]
        }
      }, (err, res) => {
        if (err || res.statusCode !== 201) {
          console.log('Error sending message %o', err || res.statusCode);
          cb(err || new Error(res.statusCode));
          return;
        }

        console.log('Send result %d, %o', res.statusCode, res.body);
        cb(null, res.body);
      });
    },
    getConversation: (conversationId, cb) => {
      request.post(`${this.watsonEndpointUrl}/graphql`, {
        headers: {
          jwt: this.token,
          'Content-Type': 'application/graphql',
        },
        body: 'query getConversation {   conversation(id: "conversation-id") { id    created    updated    messages(first: 50) {      items {        content        contentType        annotations      }    }  }}'
      },
        (err, res) => {
          if (err || res.statusCode !== 200) {
            console.log('Error retrieving converstation %o', err || res.statusCode);
            cb(err || new Error(res.statusCode));
            return;
          }

          // Return the list of members
          const body = JSON.parse(res.body);
          console.log(body);
          const conv = body.data;

          console.log(`listing conversation: ${conv}`);
          cb(conv);
        });






    },


    whatMatters: (cb) => {
      // call the watson api for moments
      cb();
    },
  };
}

module.exports = function (options, onReady) {
  if (!options || !options.APPID || !options.SECRET) {
    throw new Error('Missing options for APPID and SECRET');
  }

  return new WatsonServices(options.APPID, options.SECRET, onReady);
};
