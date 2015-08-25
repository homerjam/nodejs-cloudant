/**
 * Copyright (c) 2015 IBM Cloudant, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

// These tests are all examples from the README.md. For now, they are manually
// synchronized with the README document, a situation I would charitably describe
// as "eventually consistent."
//
// As much as possible, one should copy and paste the examples unmodified, with
// a few exceptions:
//
//   1. require("cloudant") becomes require(CLOUDANT)
//   2. console.log() becomes a should() call to actually confirm the results
//   3. Insert a call to done() when the tests are complete

require('dotenv').config();

var should = require('should');

var nock = require('./nock.js');
var CLOUDANT = '../cloudant.js'


describe('Getting Started', function() {
  this.timeout(10 * 1000);

  nock('https://nodejs.cloudant.com').get('/_all_dbs').reply(200, ['database_changes', 'third_party_db']);

  it('Example 1', function(done) {
    // Load the Cloudant library.
    var Cloudant = require(CLOUDANT);

    var me = 'nodejs'; // Set this to your own account
    var password = process.env.cloudant_password;

    // Initialize the library with my account.
    var cloudant = Cloudant({account:me, password:password});

    cloudant.db.list(function(err, allDbs) {
      should(err).equal(null);
      allDbs.should.be.an.instanceOf(Array);
      done();
    });
  });

  nock('https://nodejs.cloudant.com').delete('/alice').reply(404, {error:'not_found', reason:'Database does not exist.'});
  nock('https://nodejs.cloudant.com').put('/alice').reply(201, {ok:true});
  nock('https://nodejs.cloudant.com').put('/alice/rabbit').reply(201, {ok:true, id:'rabbit', rev:'1-6e4cb465d49c0368ac3946506d26335d'});

  it('Example 2', function(done) {
    require('dotenv').load();

    // Load the Cloudant library.
    var Cloudant = require(CLOUDANT);

    // Initialize Cloudant with settings from .env
    var username = process.env.cloudant_username || "nodejs";
    var password = process.env.cloudant_password;
    var cloudant = Cloudant({account:username, password:password});

    // Remove any existing database called "alice".
    cloudant.db.destroy('alice', function(err) {

      // Create a new "alice" database.
      cloudant.db.create('alice', function() {

        // Specify the database we are going to use (alice)...
        var alice = cloudant.db.use('alice')

        // ...and insert a document in it.
        alice.insert({ crazy: true }, 'rabbit', function(err, body, header) {
          if (err) {
            return console.log('[alice.insert] ', err.message);
          }

          should(err).equal(null);
          body.should.be.an.instanceOf(Object);
          body.ok.should.be.equal(true);
          body.id.should.be.equal('rabbit');
          body.should.have.a.property('rev').which.is.instanceOf(String);
          done();
        });
      });
    });
  });
});

describe('Initialization', function() {
  this.timeout(10 * 1000);

  nock('https://nodejs.cloudant.com').get('/_session').reply(200, {ok:true, userCtx:{name:'nodejs', roles:[]}});
  nock('https://nodejs.cloudant.com').get('/').reply(200, {couchdb:'Welcome', version:'1.0.2', cloudant_build:'2488'});
  nock('https://nodejs.cloudant.com').get('/animals/dog').reply(404, {error:'not_found', reason:'missing'});

  it('Example 1', function(done) {
    var Cloudant = require(CLOUDANT);
    var me = 'nodejs'; // Replace with your account.
    var password = process.env.cloudant_password;

    Cloudant({account:me, password:password}, function(err, cloudant) {
      if (err) {
        return console.log('Failed to initialize Cloudant: ' + err.message);
      }

      var db = cloudant.db.use("animals");
      db.get("dog", function(err, data) {
        // The rest of your code goes here. For example:
        err.should.be.an.Object.have.a.property('error').equal('not_found')
        done();
      });
    });
  });
});