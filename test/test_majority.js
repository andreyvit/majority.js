(function() {
  var PING_INTERVAL, _ref, assert, puts, startMajorityElector, test, testMajorityElector;
  var __hasProp = Object.prototype.hasOwnProperty;
  assert = require('assert');
  _ref = require('sys');
  puts = _ref.puts;
  _ref = require('../lib/majority');
  startMajorityElector = _ref.startMajorityElector;
  PING_INTERVAL = 100;
  testMajorityElector = function(name, scenario, callback) {
    var _i, _len, _ref2, add, master, nextNodeId, nodes, process, scenarioTime, status;
    nodes = [];
    status = {};
    master = {};
    nextNodeId = 1;
    puts("");
    puts("");
    puts("Scenario: " + (name));
    add = function() {
      var _ref2, becomeMaster, broadcast, giveUpMaster, nodeId, obtainListOfNodes, trace;
      _ref2 = [nextNodeId, nextNodeId + 1];
      nodeId = _ref2[0];
      nextNodeId = _ref2[1];
      broadcast = function(masterVote, candidateVote) {
        var _i, _len, _ref3, _result, node, nodeStatus;
        nodeStatus = status[nodeId];
        if (nodeStatus !== 'offline') {
          _result = []; _ref3 = nodes;
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            node = _ref3[_i];
            _result.push(node.incomingPing(nodeId, masterVote, candidateVote));
          }
          return _result;
        }
      };
      becomeMaster = function() {
        master[nodeId] = true;
        puts("");
        puts("NODE " + (nodeId) + " BECOMES A MASTER");
        return puts("");
      };
      giveUpMaster = function() {
        master[nodeId] = false;
        puts("");
        puts("NODE " + (nodeId) + " NO LONGER A MASTER");
        return puts("");
      };
      obtainListOfNodes = function() {
        return nodes;
      };
      trace = function(data) {
        var _ref3, _result, consensusCandidateId, consensusMasterId, myCandidateVote, myMasterVote, replies, reply, senderId;
        _ref3 = data;
        consensusMasterId = _ref3.consensusMasterId;
        consensusCandidateId = _ref3.consensusCandidateId;
        myMasterVote = _ref3.myMasterVote;
        myCandidateVote = _ref3.myCandidateVote;
        replies = _ref3.replies;
        return puts("\#" + (nodeId) + ": MM=" + (consensusMasterId) + " CC=" + (consensusCandidateId) + " M=" + (myMasterVote) + " C=" + (myCandidateVote) + "  VOTES " + ((function() {
          _result = []; _ref3 = replies;
          for (senderId in _ref3) {
            if (!__hasProp.call(_ref3, senderId)) continue;
            reply = _ref3[senderId];
            _result.push("<" + (reply.masterVote) + "," + (reply.candidateVote) + ">");
          }
          return _result;
        })().join(" ")));
      };
      nodes.push(startMajorityElector({
        nodeId: nodeId,
        pingInterval: PING_INTERVAL,
        broadcast: broadcast,
        becomeMaster: becomeMaster,
        giveUpMaster: giveUpMaster,
        obtainListOfNodes: obtainListOfNodes,
        trace: trace
      }));
      status[nodeId] = 'online';
      master[nodeId] = false;
      return nodeId;
    };
    process = function(command, nodeId) {
      var _i, _len, _ref2, _result, currentMasters, expectedMasters, i, id, ids, node;
      switch (command) {
        case 'add':
          ids = [];
          for (i = 1; (1 <= nodeId ? i <= nodeId : i >= nodeId); (1 <= nodeId ? i += 1 : i -= 1)) {
            ids.push(add());
          }
          puts("");
          puts("ADDED NODES " + ((function() {
            _result = []; _ref2 = ids;
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              id = _ref2[_i];
              _result.push("" + (id));
            }
            return _result;
          })().join(" ")));
          return puts("");
        case 'online':
          puts("");
          puts("NODE " + (nodeId) + " RECOVERS");
          puts("");
          return (status[nodeId] = 'online');
        case 'offline':
          puts("");
          puts("NODE " + (nodeId) + " CRASHES");
          puts("");
          return (status[nodeId] = 'offline');
        case 'master':
          puts("");
          puts("assert: " + (nodeId) + " is a master");
          puts("");
          currentMasters = (function() {
            _result = []; _ref2 = nodes;
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              node = _ref2[_i];
              if (master[node.nodeId]) {
                _result.push("" + (node.nodeId));
              }
            }
            return _result;
          })().join("+");
          expectedMasters = nodeId ? ("" + (nodeId)) : "";
          return assert.equal(currentMasters, expectedMasters);
        case 'done':
          _ref2 = nodes;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            node = _ref2[_i];
            node.shutdown();
          }
          if (callback) {
            return callback();
          }
          break;
      }
    };
    scenarioTime = 0;
    _ref2 = scenario;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      (function() {
        var item;
        var item = _ref2[_i];
        item = item.split(" ");
        if (item[1]) {
          item[1] = parseInt(item[1]);
        }
        return item[0] === 'wait' ? scenarioTime += item[1] : setTimeout(function() {
          return process.apply(this, item);
        }, scenarioTime * PING_INTERVAL);
      })();
    }
    return setTimeout(function() {
      return process('done');
    }, (scenarioTime + 1) * PING_INTERVAL);
  };
  test = function(tests) {
    var _ref2, _result, definition, name, next;
    tests = (function() {
      _result = []; _ref2 = tests;
      for (name in _ref2) {
        if (!__hasProp.call(_ref2, name)) continue;
        definition = _ref2[name];
        _result.push([name, definition]);
      }
      return _result;
    })();
    next = function() {
      var test;
      if (tests.length === 0) {
        return null;
      }
      test = tests.shift();
      return testMajorityElector(test[0], test[1], next);
    };
    return next();
  };
  test({
    'should elect node 1 when 3 nodes are running without any problems': ['add 3', 'wait 4', 'master 1'],
    'should switch to node 2 when node 1 becomes offline': ['add 3', 'wait 4', 'master 1', 'offline 1', 'wait 4', 'master 2'],
    "should not switch to node 1 when it recovers after being offline": ['add 3', 'wait 4', 'master 1', 'offline 1', 'wait 4', 'master 2', 'online 1', 'wait 4', 'master 2']
  });
}).call(this);
